class VideoMediaPlayer {
  constructor({ manifestJSON, network }) {
    this.manifestJSON = manifestJSON;
    this.videoElement = null;
    this.network = network;
    this.sourceBuffer = null;
    this.videoDuration = 0
    this.selected = {}
  }

  initializeCodec() {
    this.videoElement = document.getElementById("vid");
    const mediaSourceSupported = !!window.MediaSource;
    if (!mediaSourceSupported) {
      alert("Não suporta");
      return;
    }
    const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec);
    if (!codecSupported) {
      alert("Não suporta codec");
      return;
    }

    const mediaSource = new MediaSource()
    this.videoElement.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", this.sourceOpenWrapper(mediaSource));

  }
  sourceOpenWrapper(mediaSource) {
    return async (_) => {
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
      const selected = this.selected = this.manifestJSON.intro;
      // evita mostrar como "live"
      mediaSource.duration = this.videoDuration;
      await this.fileDownload(selected.url);
     }
  }

  async fileDownload(url) {
    const prepareUrl = {
      url,
      fileResolution: 360,
      fileResolutionTag: this.manifestJSON.fileResolutionTag,
      hostTag: this.manifestJSON.hostTag
    }
    const finalUrl = this.network.parseManifestUrl(prepareUrl);
    this.setVideoPlayerDuration(finalUrl);
    console.log(finalUrl);
    console.log("duration ", this.videoDuration);
    const data = await this.network.fetchFile(finalUrl);
    return this.processBufferSegments(data)
  }

  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split('/');
    const [ name, videoDuration ] = bars[bars.length - 1].split('-');
    this.videoDuration += videoDuration;
  }

  async processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer
    sourceBuffer.appendBuffer(allSegments)
    return new Promise((resolve, reject) => {
      const updateEnd = (_) => {
        sourceBuffer.removeEventListener("updateend", updateEnd)
        sourceBuffer.timestampOffSet = this.videoDuration
        return resolve();
      }
      sourceBuffer.addEventListener("updateend", () => {})
      sourceBuffer.addEventListener("error", reject)
    });
  }
}
