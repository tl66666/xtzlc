from pathlib import Path
import json

ROOT = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8", newline="\n")


def replace(path, old, new):
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"pattern not found in {path}: {old[:60]!r}")
    target.write_text(text.replace(old, new), encoding="utf-8", newline="\n")


cloud_image_js = r'''var cache = {};

function isCloudFile(fileID) {
  return typeof fileID === 'string' && fileID.indexOf('cloud://') === 0;
}

function isUsableImageUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }
  var value = url.trim();
  if (!value || value === '<URL>' || value.indexOf('<') !== -1 || value.indexOf('>') !== -1) {
    return false;
  }
  return value.indexOf('https://') === 0 ||
    value.indexOf('http://') === 0 ||
    value.indexOf('wxfile://') === 0 ||
    value.indexOf('tmp_') === 0 ||
    value.indexOf('/images/') === 0;
}

function done(callback, value) {
  if (typeof callback === 'function') {
    callback(isUsableImageUrl(value) ? value : '');
  }
}

function pickTempUrl(item) {
  if (item && item.status === 0 && isUsableImageUrl(item.tempFileURL)) {
    return item.tempFileURL;
  }
  return '';
}

function resolve(fileID, callback) {
  if (!isCloudFile(fileID)) {
    done(callback, fileID);
    return;
  }

  if (cache[fileID]) {
    done(callback, cache[fileID]);
    return;
  }

  wx.cloud.getTempFileURL({
    fileList: [fileID],
    success: function(res) {
      var item = res.fileList && res.fileList[0];
      var url = pickTempUrl(item);
      if (url) {
        cache[fileID] = url;
        done(callback, url);
        return;
      }
      resolveByFunction(fileID, callback);
    },
    fail: function() {
      resolveByFunction(fileID, callback);
    }
  });
}

function resolveByFunction(fileID, callback) {
  wx.cloud.callFunction({
    name: 'getAssetUrl',
    data: { fileID: fileID },
    success: function(res) {
      var result = res.result || {};
      var url = isUsableImageUrl(result.url) ? result.url : '';
      if (result.success && url) {
        cache[fileID] = url;
        done(callback, url);
      } else {
        console.warn('getAssetUrl returned no usable url:', fileID, result);
        done(callback, '');
      }
    },
    fail: function(err) {
      console.warn('getAssetUrl call failed:', fileID, err);
      done(callback, '');
    }
  });
}

function finishPending(pendingState) {
  pendingState.pending--;
  if (pendingState.pending === 0 && typeof pendingState.callback === 'function') {
    pendingState.callback(pendingState.result);
  }
}

function resolveFallbackList(fileIDs, result, callback) {
  if (!fileIDs.length) {
    callback(result);
    return;
  }

  var state = {
    pending: fileIDs.length,
    result: result,
    callback: callback
  };

  for (var i = 0; i < fileIDs.length; i++) {
    (function(fileID) {
      resolveByFunction(fileID, function(url) {
        if (url) {
          result[fileID] = url;
        }
        finishPending(state);
      });
    })(fileIDs[i]);
  }
}

function resolveMany(fileIDs, callback) {
  var result = {};
  var uniqueCloudFiles = [];
  var seen = {};

  for (var i = 0; i < fileIDs.length; i++) {
    var fileID = fileIDs[i];
    if (!fileID || seen[fileID]) {
      continue;
    }
    seen[fileID] = true;

    if (cache[fileID]) {
      result[fileID] = cache[fileID];
    } else if (isCloudFile(fileID)) {
      uniqueCloudFiles.push(fileID);
    } else if (isUsableImageUrl(fileID)) {
      result[fileID] = fileID;
    }
  }

  if (!uniqueCloudFiles.length) {
    callback(result);
    return;
  }

  wx.cloud.getTempFileURL({
    fileList: uniqueCloudFiles,
    success: function(res) {
      var failed = [];
      var list = res.fileList || [];
      var byFileID = {};

      for (var j = 0; j < list.length; j++) {
        byFileID[list[j].fileID] = list[j];
      }

      for (var k = 0; k < uniqueCloudFiles.length; k++) {
        var fileID = uniqueCloudFiles[k];
        var url = pickTempUrl(byFileID[fileID]);
        if (url) {
          cache[fileID] = url;
          result[fileID] = url;
        } else {
          failed.push(fileID);
        }
      }

      resolveFallbackList(failed, result, callback);
    },
    fail: function() {
      resolveFallbackList(uniqueCloudFiles, result, callback);
    }
  });
}

module.exports = {
  resolve: resolve,
  resolveMany: resolveMany,
  isUsableImageUrl: isUsableImageUrl
};
'''


group_function_js = r'''const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function now() {
  return new Date().toISOString();
}

function makeGroupPayload(data, openid) {
  const userInfo = data.userInfo || {};
  const inviteCode = data.inviteCode || Math.random().toString(36).slice(2, 8).toUpperCase();
  const groupInfo = {
    id: data.id || `group_${Date.now()}`,
    name: data.name || '我的旅行小队',
    type: data.type || 'friends',
    inviteCode,
    createTime: now(),
    creatorOpenid: openid
  };

  return {
    success: true,
    groupInfo,
    isCreator: true,
    isAdmin: true,
    inviteCode,
    members: [{
      openid,
      nickName: userInfo.nickName || '城会玩旅人',
      avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
      isCreator: true,
      role: '创建者',
      cityCount: data.cityCount || 0,
      photoCount: data.photoCount || 0
    }],
    stats: {
      totalMembers: 1,
      totalCities: data.cityCount || 0,
      totalProvinces: data.provinceCount || 0,
      totalPhotos: data.photoCount || 0
    },
    sharedPhotos: []
  };
}

async function getMyGroup(openid) {
  try {
    const memberRes = await db.collection('group_members').where({ openid }).limit(1).get();
    const member = memberRes.data && memberRes.data[0];
    if (!member) {
      return { success: true, groupInfo: null };
    }

    const groupRes = await db.collection('groups').doc(member.groupId).get();
    const groupInfo = groupRes.data;
    const membersRes = await db.collection('group_members').where({ groupId: member.groupId }).get();
    const members = membersRes.data || [];

    return {
      success: true,
      groupInfo,
      isCreator: groupInfo.creatorOpenid === openid,
      isAdmin: groupInfo.creatorOpenid === openid || member.role === 'admin',
      inviteCode: groupInfo.inviteCode || '',
      members,
      stats: {
        totalMembers: members.length,
        totalCities: members.reduce((sum, item) => sum + (item.cityCount || 0), 0),
        totalProvinces: groupInfo.totalProvinces || 0,
        totalPhotos: members.reduce((sum, item) => sum + (item.photoCount || 0), 0)
      },
      sharedPhotos: groupInfo.sharedPhotos || []
    };
  } catch (err) {
    return { success: true, groupInfo: null, offline: true, error: err.message };
  }
}

async function createGroup(data, openid) {
  const payload = makeGroupPayload(data, openid);
  try {
    const addRes = await db.collection('groups').add({
      data: Object.assign({}, payload.groupInfo, {
        createdAt: db.serverDate(),
        sharedPhotos: []
      })
    });
    const groupId = addRes._id;
    payload.groupInfo.id = groupId;

    await db.collection('group_members').add({
      data: Object.assign({}, payload.members[0], {
        groupId,
        role: 'creator',
        joinedAt: db.serverDate()
      })
    });

    return payload;
  } catch (err) {
    payload.offline = true;
    payload.error = err.message;
    return payload;
  }
}

async function leaveGroup(openid) {
  try {
    await db.collection('group_members').where({ openid }).remove();
  } catch (err) {
    return { success: true, offline: true, error: err.message };
  }
  return { success: true };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = (event && event.openid) || wxContext.OPENID || 'mock_openid';
  const action = event && event.action;
  const data = (event && event.data) || {};

  if (action === 'getMyGroup') {
    return getMyGroup(openid);
  }
  if (action === 'createGroup') {
    return createGroup(data, openid);
  }
  if (action === 'leaveGroup') {
    return leaveGroup(openid);
  }

  return { success: false, error: 'UNKNOWN_ACTION' };
};
'''


launch_wxml = r'''<view class="launch-container">
  <image class="bg-image" src="/images/launch/bg.png" mode="aspectFill"/>

  <view class="bg-decoration">
    <view class="circle circle-1"></view>
    <view class="circle circle-2"></view>
    <view class="circle circle-3"></view>
  </view>

  <view class="content">
    <view class="logo-section">
      <view class="logo-wrapper">
        <image class="logo-image" src="/images/launch/logo.png" mode="aspectFit"/>
        <view class="logo-glow"></view>
      </view>
      <view class="app-name">城会玩2.0</view>
      <view class="app-slogan">点亮城市，收集你的旅行角色卡</view>
    </view>

    <view class="stats-section" wx:if="{{showStats}}">
      <view class="stat-item">
        <view class="stat-number">{{totalUsers}}</view>
        <view class="stat-label">旅行者</view>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <view class="stat-number">{{totalCities}}</view>
        <view class="stat-label">城市坐标</view>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <view class="stat-number">{{totalPhotos}}</view>
        <view class="stat-label">旅行照片</view>
      </view>
    </view>

    <view class="features-section" wx:if="{{showFeatures}}">
      <view class="feature-item">
        <image class="feature-icon-img" src="/images/launch/icon-map.png" mode="aspectFit"/>
        <view class="feature-text">点亮中国地图</view>
      </view>
      <view class="feature-item">
        <image class="feature-icon-img" src="/images/launch/icon-camera.png" mode="aspectFit"/>
        <view class="feature-text">记录旅行瞬间</view>
      </view>
      <view class="feature-item">
        <image class="feature-icon-img" src="/images/launch/icon-friends.png" mode="aspectFit"/>
        <view class="feature-text">解锁城市角色</view>
      </view>
    </view>
  </view>

  <view class="bottom-section">
    <view class="btn btn-wechat" wx:if="{{!isLogin}}" bindtap="onWechatLogin">
      <view class="btn-icon-wechat"></view>
      <view class="btn-text">微信一键登录</view>
    </view>

    <view class="btn btn-guest" wx:if="{{!isLogin}}" bindtap="onGuestLogin">
      <view class="btn-text">游客模式体验</view>
    </view>

    <view class="btn btn-enter" wx:if="{{isLogin}}" bindtap="enterApp">
      <view class="btn-text">进入城会玩</view>
      <view class="btn-arrow">→</view>
    </view>

    <view class="user-info" wx:if="{{isLogin && userInfo}}">
      <image class="user-avatar" src="{{userInfo.avatarUrl || '/images/avatar.png'}}" mode="aspectFill"/>
      <view class="user-name">{{userInfo.nickName}}</view>
    </view>

    <view class="agreement-text" wx:if="{{!isLogin}}">
      登录即表示同意《用户协议》和《隐私政策》
    </view>
  </view>

  <view class="version">城会玩2.0</view>
</view>
'''


launch_js = r'''var app = getApp();

Page({
  data: {
    isLogin: false,
    userInfo: null,
    showStats: false,
    showFeatures: false,
    totalUsers: '12.8K',
    totalCities: '391',
    totalPhotos: '56.2K'
  },

  onLoad: function(options) {
    var fromPage = options.from || '';
    if (fromPage === 'switchLogin') {
      this.setData({
        isLogin: false,
        userInfo: null
      });
    } else {
      this.checkLoginStatus();
    }

    var self = this;
    setTimeout(function() {
      self.setData({ showStats: true });
    }, 500);

    setTimeout(function() {
      self.setData({ showFeatures: true });
    }, 800);
  },

  onShow: function() {
    this.checkLoginStatus();
  },

  checkLoginStatus: function() {
    var isLogin = app.globalData.isLogin;
    var userInfo = app.globalData.userInfo;
    var displayUserInfo = null;

    if (userInfo) {
      displayUserInfo = {
        nickName: userInfo.nickName || '城会玩旅人',
        avatarUrl: userInfo.avatarUrl || '/images/avatar.png'
      };
    }

    this.setData({
      isLogin: isLogin,
      userInfo: displayUserInfo
    });
  },

  onWechatLogin: function() {
    var self = this;

    wx.showLoading({ title: '登录中...' });

    wx.getUserProfile({
      desc: '用于同步旅行足迹和角色卡',
      success: function(res) {
        var userInfo = res.userInfo;
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', JSON.stringify(userInfo));

        app.login(function(success) {
          wx.hideLoading();
          if (success) {
            self.setData({
              isLogin: true,
              userInfo: app.globalData.userInfo
            });

            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });

            setTimeout(function() {
              self.enterApp();
            }, 800);
          } else {
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({
          title: '需要授权后使用',
          icon: 'none'
        });
      }
    });
  },

  onGuestLogin: function() {
    var self = this;

    wx.showModal({
      title: '游客模式',
      content: '游客模式下数据只保存在本地，换设备或清缓存后可能丢失。登录微信后可以同步城市、照片和角色卡。',
      confirmText: '继续体验',
      cancelText: '微信登录',
      success: function(res) {
        if (res.confirm) {
          app.globalData.isLogin = true;
          app.globalData.userInfo = {
            nickName: '游客',
            avatarUrl: '/images/avatar.png'
          };
          app.globalData.useCloud = false;

          wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));

          self.setData({
            isLogin: true,
            userInfo: app.globalData.userInfo
          });

          wx.showToast({
            title: '已进入游客模式',
            icon: 'none'
          });

          setTimeout(function() {
            self.enterApp();
          }, 800);
        }
      }
    });
  },

  enterApp: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
'''


def update_cards(path):
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    text = text.replace(
        "        isCollected: isCollected,\n        imagePath: cloudPath\n",
        "        isCollected: isCollected,\n        cloudPath: cloudPath,\n        imagePath: '/images/ui/loading-bg.png'\n",
    )
    text = text.replace(
        "        var resolvedUrl = urlMap[newCards[i].imagePath];\n",
        "        var resolvedUrl = urlMap[newCards[i].cloudPath];\n",
    )
    p.write_text(text, encoding="utf-8", newline="\n")


def update_json_file(path, updater):
    p = ROOT / path
    data = json.loads(p.read_text(encoding="utf-8"))
    updater(data)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")


def main():
    write("utils/cloudImage.js", cloud_image_js)
    update_cards("pages/cards/cards.js")
    update_cards("package-cards/pages/cards/cards.js")

    write("cloudfunctions/group/index.js", group_function_js)
    write("cloudfunctions/group/package.json", json.dumps({
        "name": "group",
        "version": "1.0.0",
        "main": "index.js",
        "dependencies": {
            "wx-server-sdk": "~2.6.3"
        }
    }, ensure_ascii=False, indent=2))

    def app_json_updater(data):
        data.setdefault("window", {})["navigationBarTitleText"] = "城会玩2.0"
        labels = ["地图", "角色卡", "相册", "我的"]
        for item, label in zip(data.get("tabBar", {}).get("list", []), labels):
            item["text"] = label

    update_json_file("app.json", app_json_updater)

    def project_json_updater(data):
        data["description"] = "城会玩2.0 - 点亮城市，收集旅行角色卡"
        data["projectname"] = "城会玩2.0"
        data["appid"] = "wx1bccd82d1adb0fa9"
        data["cloudfunctionRoot"] = "cloudfunctions/"

    update_json_file("project.config.json", project_json_updater)

    write("pages/launch/launch.wxml", launch_wxml)
    write("pages/launch/launch.js", launch_js)

    for rel in ["pages/group/group.js", "package-others/pages/group/group.js"]:
      p = ROOT / rel
      if p.exists():
        text = p.read_text(encoding="utf-8")
        text = text.replace("console.error('鑾峰彇缇ょ粍淇℃伅澶辫触:', err);", "console.warn('获取群组信息失败，已使用本地数据兜底:', err);")
        text = text.replace("console.error('浜戠鍒涘缓澶辫触:', err);", "console.warn('云端创建群组失败，已保留本地数据:', err);")
        text = text.replace("console.error('浜戠閫€鍑哄け璐?', err);", "console.warn('云端退出群组失败，本地数据已清理:', err);")
        p.write_text(text, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
