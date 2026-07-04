window.WORKS_READY = (async () => {
  const payload = (window.WORKS_PAYLOAD_CHUNKS || []).join("");
  if (!payload) {
    throw new Error("作品目录数据没有加载成功。");
  }
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  if (!("DecompressionStream" in window)) {
    throw new Error("当前浏览器不支持作品目录解压，请使用新版浏览器访问。");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  window.WORKS = JSON.parse(text);
  return window.WORKS;
})();
