(function () {
  'use strict';
  window.SkyCommunity = function (options) {
    var cloud = options.cloud, $ = function (id) { return document.getElementById(id); };
    var account = cloud.snapshot(), posts = [], nextOffset = null, current = null, commentOffset = null;
    var active = false, loading = false, feedVersion = 0, detailVersion = 0, publishVersion = 0, publishLoading = false;
    function el(tag, text, className) { var node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; }
    function button(text, fn, auth) {
      var node = el('button', text, 'btn small'); node.type = 'button';
      if (auth) node.dataset.needsAccount = 'true';
      node.addEventListener('click', function () { act(fn); }); return node;
    }
    function disabled() {
      document.querySelectorAll('#view-community [data-needs-account], #publishForm input, #publishForm textarea, #publishForm select, #publishSubmit').forEach(function (node) {
        node.disabled = !account.user || account.busy || publishLoading;
      });
      $('communityComment').disabled = $('communitySendComment').disabled = !account.user || account.busy || !current;
      $('communityMore').disabled = $('communityRefresh').disabled = loading;
      $('communityFilter').querySelectorAll('option').forEach(function (option) { option.disabled = option.value !== 'all' && !account.user; });
    }
    async function act(fn) { try { await fn(); } catch (error) { options.toast(window.SkyCloud.errorMessage(error)); } finally { disabled(); } }
    function status(text) { $('communityStatus').textContent = text; }
    function rowFor(post) {
      var article = el('article', null, 'community-card'); article.dataset.postId = post.id;
      article.append(el('h3', post.title));
      article.append(el('p', 'Người đăng: @' + post.username + ' · ' + post.bpm + ' BPM', 'hint'));
      if (post.composer) article.append(el('p', 'Tác giả nhạc gốc: ' + post.composer, 'hint'));
      if (post.creditUsername) article.append(el('p', 'Chuyển soạn từ bản chia sẻ của @' + post.creditUsername, 'hint'));
      if (post.description) article.append(el('p', post.description, 'post-description'));
      var actions = el('div', null, 'row');
      actions.append(button('Chi tiết & bình luận (' + post.comments + ')', function () { return openPost(post.id); }));
      var previewButton = button('Nghe thử (30 giây)', async function () {
        var version = feedVersion;
        var data = await cloud.community('post', 'GET', undefined, { id: post.id });
        if (version === feedVersion && document.contains(previewButton)) options.preview(data.post, previewButton);
      });
      actions.append(previewButton);
      var like = button((post.liked ? '♥ Đã thích ' : '♡ Thích ') + post.likes, async function () {
        var data = await cloud.community('like', 'PUT', { id: post.id, active: !post.liked });
        post.liked = data.active; post.likes = data.count; renderPosts(); if (current && current.id === post.id) { current.liked = data.active; current.likes = data.count; renderDetail(current); }
      }, true); like.setAttribute('aria-pressed', post.liked); actions.append(like);
      var copy = button(post.saved ? 'Đã có trong thư viện' : 'Thêm vào thư viện', async function () {
        var data = await cloud.community('copy-post', 'POST', { id: post.id });
        await cloud.refresh(); post.saved = true; renderPosts();
        options.toast(data.alreadySaved ? 'Bài này đã có trong thư viện.' : 'Đã thêm bản sao riêng vào thư viện, giữ nguồn @' + post.username + '.');
      }, true); actions.append(copy);
      if (!post.own) {
        var follow = button(post.following ? 'Đang theo dõi @' + post.username : 'Theo dõi @' + post.username, async function () {
          var data = await cloud.community('follow', 'PUT', { userId: post.userId, active: !post.following });
          posts.forEach(function (item) { if (item.userId === post.userId) item.following = data.active; }); renderPosts();
          if ($('communityFilter').value === 'following' && !data.active) await loadFeed(false);
          options.toast(data.active ? 'Đã theo dõi @' + post.username : 'Đã bỏ theo dõi @' + post.username);
        }, true); follow.setAttribute('aria-pressed', post.following); actions.append(follow);
      } else {
        actions.append(button('Cập nhật bài công khai', function () { return openPublish(post.sourceSongId); }, true));
        actions.append(button('Gỡ công khai', async function () {
          await cloud.community('post', 'DELETE', { id: post.id });
          if (current && current.id === post.id) closeDetail();
          await loadFeed(false); options.toast('Đã gỡ công khai. Các bản sao người khác đã lưu vẫn được giữ.');
        }, true));
      }
      article.append(actions); return article;
    }
    function renderPosts() {
      $('communityPosts').textContent = ''; posts.forEach(function (post) { $('communityPosts').append(rowFor(post)); });
      $('communityMore').hidden = nextOffset == null; disabled();
    }
    async function loadFeed(more) {
      active = true;
      if (!account.ready) { status('Đang kết nối cộng đồng…'); return; }
      if (!account.configured) { status('Cộng đồng chưa khả dụng trên đường dẫn này. Bạn vẫn có thể chơi và lưu bài tại máy.'); return; }
      var version = ++feedVersion; loading = true; disabled(); status('Đang tải bài cộng đồng…');
      if (!more) { posts = []; nextOffset = null; renderPosts(); }
      try {
        var data = await cloud.community('community', 'GET', undefined, { q: $('communityQuery').value.trim(), filter: $('communityFilter').value, offset: more ? nextOffset || 0 : 0 });
        if (version !== feedVersion) return;
        var known = new Set(posts.map(function (post) { return post.id; }));
        posts = posts.concat(data.posts.filter(function (post) { return !known.has(post.id); })); nextOffset = data.nextOffset; renderPosts();
        status(posts.length ? 'Nghe thử tối đa 30 giây. Thêm vào thư viện để giữ bản sao riêng; chỉnh sửa không ảnh hưởng người đăng.' : 'Chưa có bài phù hợp. Bạn có thể đăng bản đã lưu từ Thư viện hoặc Bản nhạc & AI.');
      } catch (error) { if (version === feedVersion) status(window.SkyCloud.errorMessage(error)); }
      finally { if (version === feedVersion) { loading = false; disabled(); } }
    }
    function closeDetail() { detailVersion++; current = null; commentOffset = null; $('communityDetail').hidden = true; $('communityDetailBody').textContent = ''; $('communityComments').textContent = ''; $('communityComment').value = ''; options.stopPreview(); disabled(); }
    function renderDetail(post) {
      var body = $('communityDetailBody'); body.textContent = ''; $('communityDetailTitle').textContent = post.title;
      body.append(el('p', 'Người đăng: @' + post.username + (post.composer ? ' · Tác giả nhạc gốc: ' + post.composer : ''), 'hint'));
      if (post.creditUsername) body.append(el('p', 'Nguồn chia sẻ: @' + post.creditUsername, 'hint'));
      if (post.description) body.append(el('p', post.description, 'post-description'));
      if (post.sourceUrl) {
        try { var url = new URL(post.sourceUrl); if (['http:', 'https:'].includes(url.protocol)) { var link = el('a', 'Nguồn bản nhạc'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; body.append(link); } } catch (_) {}
      }
      var text = el('textarea', null, 'mono'); text.readOnly = true; text.rows = 6; text.value = post.text; text.setAttribute('aria-label', 'Bản nhạc cộng đồng dạng chữ'); body.append(text);
      var actions = el('div', null, 'row');
      var preview = button('Nghe thử (30 giây)', function () { options.preview(post, preview); }); actions.append(preview);
      actions.append(button('Đưa vào bản nhạc & AI', function () { options.stage(post); }));
      actions.append(button('Sao chép bản nhạc', function () { options.copy(post.text, text); })); body.append(actions);
      disabled();
    }
    async function loadComments(more) {
      if (!current) return;
      var version = detailVersion, postId = current.id;
      try {
        var data = await cloud.community('comments', 'GET', undefined, { postId: postId, offset: more ? commentOffset || 0 : 0 });
        if (version !== detailVersion || !current || current.id !== postId) return;
        if (!more) $('communityComments').textContent = '';
        data.comments.forEach(function (comment) {
          var item = el('li', null, 'comment'); item.append(el('strong', '@' + comment.username), el('p', comment.content));
          if (comment.canDelete) item.append(button('Xóa bình luận', async function () {
            await cloud.community('comments', 'DELETE', { id: comment.id, postId: postId }); await loadComments(false);
            posts.forEach(function (post) { if (post.id === postId) post.comments = Math.max(0, post.comments - 1); }); renderPosts();
          }, true));
          $('communityComments').append(item);
        });
        commentOffset = data.nextOffset; $('communityCommentsMore').hidden = commentOffset == null; disabled();
      } catch (error) { if (version === detailVersion) $('communityDetailStatus').textContent = window.SkyCloud.errorMessage(error); }
    }
    async function openPost(id) {
      closeDetail(); var version = detailVersion;
      $('communityDetail').hidden = false; $('communityDetailStatus').textContent = 'Đang tải bài…';
      try {
        var data = await cloud.community('post', 'GET', undefined, { id: id });
        if (version !== detailVersion) return;
        current = data.post; renderDetail(current); $('communityDetailStatus').textContent = account.user ? '' : 'Đăng nhập để gửi bình luận.';
        await loadComments(false);
        if ($('communityDetail').scrollIntoView) $('communityDetail').scrollIntoView({ block: 'start', behavior: 'smooth' });
      } catch (error) { if (version === detailVersion) $('communityDetailStatus').textContent = window.SkyCloud.errorMessage(error); }
    }
    async function publicationInfo() {
      var version = ++publishVersion, songId = $('publishSelect').value;
      publishLoading = true; disabled(); $('publishStatus').textContent = 'Đang kiểm tra bản đã đăng…';
      try {
        var data = await cloud.community('publish', 'GET', undefined, { songId: songId });
        if (version !== publishVersion) return;
        var previous = data.publication, song = account.songs.find(function (item) { return item.id === songId; });
        $('publishDescription').value = previous ? previous.description : '';
        $('publishComposer').value = previous ? previous.composer : song && song.source ? song.source.composer || '' : '';
        $('publishSource').value = previous ? previous.sourceUrl : song && song.source ? song.source.url || '' : '';
        $('publishStatus').textContent = previous && previous.isPublic ? 'Bài đã công khai. Đăng lại để cập nhật nội dung từ bản đã lưu.' : 'Bài sẽ xuất hiện trong Cộng đồng với tên @' + account.user.username + '.';
      } catch (error) { if (version === publishVersion) $('publishStatus').textContent = window.SkyCloud.errorMessage(error); }
      finally { if (version === publishVersion) { publishLoading = false; disabled(); } }
    }
    async function openPublish(songId) {
      if (!account.user) { options.toast('Hãy đăng nhập và lưu bài vào tài khoản trước khi đăng.'); options.login(); return; }
      if (account.loading || account.busy || !account.songs.length) { options.toast('Hãy lưu bài vào tài khoản trước rồi chọn Đăng bài đã lưu.'); return; }
      $('publishSelect').textContent = '';
      account.songs.forEach(function (song) { var option = el('option', song.title); option.value = song.id; $('publishSelect').append(option); });
      if (songId && account.songs.some(function (song) { return song.id === songId; })) $('publishSelect').value = songId;
      $('publishConsent').checked = false; $('publishDialog').showModal();
      await publicationInfo();
    }
    function closePublish() { publishVersion++; publishLoading = false; if ($('publishDialog').open) $('publishDialog').close(); }
    $('publishClose').addEventListener('click', closePublish);
    $('publishDialog').addEventListener('cancel', function (event) { event.preventDefault(); closePublish(); });
    $('publishSelect').addEventListener('change', publicationInfo);
    $('publishForm').addEventListener('submit', async function (event) {
      event.preventDefault(); if (!this.reportValidity() || account.busy || publishLoading) return;
      try {
        await cloud.community('publish', 'POST', { songId: $('publishSelect').value, description: $('publishDescription').value, composer: $('publishComposer').value, sourceUrl: $('publishSource').value });
        closePublish(); options.toast('Đã đăng bản đã lưu lên Cộng đồng.'); await loadFeed(false); options.goCommunity();
      } catch (error) { $('publishStatus').textContent = window.SkyCloud.errorMessage(error); }
    });
    $('publishSongBtn').addEventListener('click', function () { var song = account.songs.find(function (item) { return item.title === options.title(); }); act(function () { return openPublish(song && song.id); }); });
    $('communitySearchForm').addEventListener('submit', function (event) { event.preventDefault(); closeDetail(); loadFeed(false); });
    $('communityFilter').addEventListener('change', function () { closeDetail(); loadFeed(false); });
    $('communityRefresh').addEventListener('click', function () { closeDetail(); loadFeed(false); });
    $('communityMore').addEventListener('click', function () { loadFeed(true); });
    $('communityCloseDetail').addEventListener('click', closeDetail);
    $('communityCommentsMore').addEventListener('click', function () { loadComments(true); });
    $('communityCommentForm').addEventListener('submit', async function (event) {
      event.preventDefault(); if (!current || !account.user || account.busy || !this.reportValidity()) return;
      var version = detailVersion, postId = current.id, content = $('communityComment').value;
      try {
        await cloud.community('comments', 'POST', { postId: postId, content: content });
        if (version !== detailVersion) return;
        $('communityComment').value = ''; $('communityDetailStatus').textContent = 'Đã gửi bình luận.'; await loadComments(false);
        posts.forEach(function (post) { if (post.id === postId) post.comments++; }); renderPosts();
      } catch (error) { if (version === detailVersion) $('communityDetailStatus').textContent = window.SkyCloud.errorMessage(error); }
    });
    cloud.subscribe(function (state) {
      var changed = (account.user && account.user.uid) !== (state.user && state.user.uid), ready = !account.ready && state.ready;
      account = state;
      if (changed) {
        feedVersion++; posts = []; nextOffset = null; loading = false; closeDetail(); closePublish(); renderPosts();
        if (!state.user) $('communityFilter').value = 'all';
      }
      disabled(); if (active && (changed || ready)) loadFeed(false);
    });
    return { open: function () { if (!active || !posts.length) loadFeed(false); }, openPublish: openPublish };
  };
})();
