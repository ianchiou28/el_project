export async function fetchHotSongs(limit = 20) {
  // 默认使用网易云飙升榜（歌单ID: 19723756）
  return await fetchPlaylistSongs(3778678, limit);
}

// 搜索歌单（返回歌单列表）
export async function searchPlaylists(keywords, limit = 10) {
  const res = await fetch(`https://1304844466-77ktldn4gt.ap-nanjing.tencentscf.com/search?keywords=${encodeURIComponent(keywords)}&type=1000&limit=${limit}`);
  const data = await res.json();
  return (data.result && data.result.playlists) ? data.result.playlists : [];
}

// 获取歌单内所有可播放歌曲
export async function fetchPlaylistSongs(playlistId, limit) {
  // 1. 获取歌单详情
  const res = await fetch(`https://1304844466-77ktldn4gt.ap-nanjing.tencentscf.com/playlist/detail?id=${playlistId}`);
  const data = await res.json();
  const tracks = (data.playlist && data.playlist.trackIds) ? data.playlist.trackIds : [];
  if (!tracks.length) return [];

  // 网易云API单次最多支持100首，需分批获取
  const allIds = tracks.map(t => t.id);
  let result = [];
  let count = limit || allIds.length;
  for (let i = 0; i < allIds.length && result.length < count; i += 100) {
    const batchIds = allIds.slice(i, i + 100).join(',');
    const urlRes = await fetch(`https://1304844466-77ktldn4gt.ap-nanjing.tencentscf.com/song/url?id=${batchIds}`);
    const urlData = await urlRes.json();
    const urlMap = {};
    (urlData.data || []).forEach(item => {
      urlMap[item.id] = item.url;
    });
    // 歌曲元信息
    const metaRes = await fetch(`https://1304844466-77ktldn4gt.ap-nanjing.tencentscf.com/song/detail?ids=${batchIds}`);
    const metaData = await metaRes.json();
    (metaData.songs || []).forEach(song => {
      if (result.length < count) {
        result.push({
          title: song.name,
          artist: song.ar && song.ar.map(a => a.name).join(', ') || '',
          url: urlMap[song.id] || ''
        });
      }
    });
  }
  // 转换所有 http:// 为 https://
  result = result.map(song => ({
    ...song,
    url: song.url.startsWith('http://')
      ? song.url.replace(/^http:\/\//, 'https://')
      : song.url
  }));
  // 只返回 HTTPS 可播放的歌曲 URL
  return result.filter(song => song.url && song.url.startsWith('https://'))
}

// 搜索单曲（返回可播放歌曲列表）
export async function searchSongs(keywords, limit = 10) {
  // 1. 搜索单曲
  const res = await fetch(`https://1304844466-77ktldn4gt.ap-nanjing.tencentscf.com/search?keywords=${encodeURIComponent(keywords)}&type=1&limit=${limit}`);
  const data = await res.json();
  const songs = (data.result && data.result.songs) ? data.result.songs : [];
  if (!songs.length) return [];

  // 2. 批量获取歌曲url
  const ids = songs.map(song => song.id).join(',');
  const urlRes = await fetch(`https://1304844466-77ktldn4gt.ap-nanjing.tencentscf.com/song/url?id=${ids}`);
  const urlData = await urlRes.json();
  const urlMap = {};
  (urlData.data || []).forEach(item => {
    urlMap[item.id] = item.url;
  });

  // 3. 组装最终歌曲列表
  const mapped = songs.map(song => {
    let u = urlMap[song.id] || '';
    if (u.startsWith('http://')) {
      u = u.replace(/^http:\/\//, 'https://');
    }
    return {
      title: song.name,
      artist: song.artists?.map(a => a.name).join(', ') || '',
      url: u
    };
  });
  // 只保留 HTTPS 链接
  return mapped.filter(song => song.url && song.url.startsWith('https://'));
}