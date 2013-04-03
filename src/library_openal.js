//"use strict";

var LibraryOpenAL = {
  $AL__deps: ['$Browser'],
  $AL: {
    contexts: [],
    currentContext: 0,
  },

  alcProcessContext: function(context) {},
  alcSuspendContext: function(context) {},

  alcMakeContextCurrent: function(context) {
    AL.currentContext = context;
    return (context > 0);
  },

  alcGetContextsDevice: function(context) {
    if (context <= AL.contexts.length && context > 0) {
      // Returns the only one audio device
      return 1;
    }
    return 0;
  },

  alcGetCurrentContext: function() {
    return AL.currentContext;
  },

  alcDestroyContext: function(context) {
    // Stop playback, etc
  },

  alcCloseDevice: function(device) {
    // Stop playback, etc
  },

  alcOpenDevice: function(deviceName) {
    if (typeof(AudioContext) == "function" ||
        typeof(webkitAudioContext) == "function") {
      return 1; // non-null pointer -- we just simulate one device
    } else {
      return 0;
    }
  },

  alcCreateContext: function(device, attrList) {
    if (device != 1) {
      return 0;
    }

    if (attrList) {
#if OPENAL_DEBUG
      console.log("The attrList argument of alcCreateContext is not supported yet");
#endif
      return 0;
    }

    var ctx;
    try {
      ctx = new AudioContext();
    } catch (e) {
      try {
        ctx = new webkitAudioContext();
      } catch (e) {}
    }

    if (ctx) {
      AL.contexts.push({ctx: ctx, err: 0, src: [], buf: []});
      return AL.contexts.length;
    } else {
      return 0;
    }
  },

  alGetError: function() {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
      return 0xA004 /* AL_INVALID_OPERATION */;
    } else {
      return AL.contexts[AL.currentContext -1].err;
    }
  },

  alcGetError__deps: ['alGetError'],
  alcGetError: function(device) {
    // We have only one audio device, so just return alGetError.
    return _alGetError();
  },

  alDeleteSources: function(count, sources)
  {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alDeleteSources called without a valid context");
#endif
      return;
    }
    for (var i = 0; i < count; ++i) {
      var sourceIdx = {{{ makeGetValue('sources', 'i*4', 'i32') }}} - 1;
      delete AL.contexts[AL.currentContext -1].src[sourceIdx];
    }
  },

  alGenSources: function(count, sources) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alGenSources called without a valid context");
#endif
      return;
    }
    for (var i = 0; i < count; ++i) {
      var gain = AL.contexts[AL.currentContext -1].ctx.createGain();
      var panner = AL.contexts[AL.currentContext -1].ctx.createPanner();
      panner.panningModel = "equalpower";
      panner.distanceModel = "linear";
      panner.rolloffFactor = 0.3;
      gain.connect(panner);
      panner.connect(AL.contexts[AL.currentContext -1].ctx.destination);
      AL.contexts[AL.currentContext -1].src.push({
        loop: false,
        buffer: null,
        gain: gain,
        panner: panner,
        paused: false,
        playTime: -1,
        pausedTime: 0
      });
      {{{ makeSetValue('sources', 'i*4', 'AL.contexts[AL.currentContext -1].src.length', 'i32') }}};
    }
  },

  alSourcei: function(source, param, value) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourcei called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourcei called with an invalid source");
#endif
      return;
    }
    switch (param) {
    case 0x1007 /* AL_LOOPING */:
      AL.contexts[AL.currentContext -1].src[source - 1].loop = (value != 0 /* AL_FALSE */);
      break;
    case 0x1009 /* AL_BUFFER */:
      if (value == 0) {
        AL.contexts[AL.currentContext -1].src[source - 1].buffer = null;
      } else {
        AL.contexts[AL.currentContext -1].src[source - 1].buffer = AL.contexts[AL.currentContext -1].buf[value - 1].buf;
      }
      break;
    default:
#if OPENAL_DEBUG
      console.log("alSourcei with param " + param + " not implemented yet");
#endif
      break;
    }
  },

  alSourcef: function(source, param, value) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourcef called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourcef called with an invalid source");
#endif
      return;
    }
    switch (param) {
    case 0x100A /* AL_GAIN */:
      if (AL.contexts[AL.currentContext -1].src[source - 1]) {
        AL.contexts[AL.currentContext -1].src[source - 1].gain.gain.value = value;
      }
      break;
    case 0x1003 /* AL_PITCH */:
#if OPENAL_DEBUG
      console.log("alSourcef was called with AL_PITCH, but Web Audio does not support static pitch changes");
#endif
      break;
    default:
#if OPENAL_DEBUG
      console.log("alSourcef with param " + param + " not implemented yet");
#endif
      break;
    }
  },

  alSourcefv: function(source, param, value) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourcefv called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourcefv called with an invalid source");
#endif
      return;
    }
    switch (param) {
    case 0x1004 /* AL_POSITION */:
      AL.contexts[AL.currentContext -1].src[source - 1].panner.setPosition(
          {{{ makeGetValue('value', '0', 'float') }}},
          {{{ makeGetValue('value', '4', 'float') }}},
          {{{ makeGetValue('value', '8', 'float') }}}
        );
      break;
    case 0x1006 /* AL_VELOCITY */:
      AL.contexts[AL.currentContext -1].src[source - 1].panner.setVelocity(
          {{{ makeGetValue('value', '0', 'float') }}},
          {{{ makeGetValue('value', '4', 'float') }}},
          {{{ makeGetValue('value', '8', 'float') }}}
        );
      break;
    default:
#if OPENAL_DEBUG
      console.log("alSourcefv with param " + param + " not implemented yet");
#endif
      break;
    }
  },

  alSourceQueueBuffers: function(source, count, buffers) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourceQueueBuffers called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourceQueueBuffers called with an invalid source");
#endif
      return;
    }
    if (count != 1) {
#if OPENAL_DEBUG
      console.error("Queuing multiple buffers using alSourceQueueBuffers is not supported yet");
#endif
      return;
    }
    for (var i = 0; i < count; ++i) {
      var buffer = {{{ makeGetValue('buffers', 'i*4', 'i32') }}};
      if (buffer > AL.contexts[AL.currentContext -1].buf.length) {
#if OPENAL_DEBUG
        console.error("alSourceQueueBuffers called with an invalid buffer");
#endif
        return;
      }
      AL.contexts[AL.currentContext -1].src[source - 1].buffer = AL.contexts[AL.currentContext -1].buf[buffer - 1].buf;
    }
  },

  alSourceUnqueueBuffers: function(source, count, buffers)
  {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourceUnqueueBuffers called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourceUnqueueBuffers called with an invalid source");
#endif
      return;
    }
    if (count != 1) {
#if OPENAL_DEBUG
      console.error("Queuing multiple buffers using alSourceUnqueueBuffers is not supported yet");
#endif
      return;
    }
    for (var i = 0; i < count; ++i) {
      var buffer = AL.contexts[AL.currentContext -1].src[source - 1].buffer;
      for (var j = 0; j < AL.contexts[AL.currentContext -1].buf.length; ++j) {
        if (buffer == AL.contexts[AL.currentContext -1].buf[j].buf) {
          {{{ makeSetValue('buffers', 'i*4', 'j+1', 'i32') }}};
          AL.contexts[AL.currentContext -1].src[source - 1].buffer = null;
          break;
        }
      }
    }
  },

  alDeleteBuffers: function(count, buffers)
  {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alDeleteBuffers called without a valid context");
#endif
      return;
    }
    for (var i = 0; i < count; ++i) {
      var bufferIdx = {{{ makeGetValue('buffers', 'i*4', 'i32') }}} - 1;
      if (bufferIdx < AL.contexts[AL.currentContext -1].buf.length && AL.contexts[AL.currentContext -1].buf[bufferIdx]) {
        var buffer = AL.contexts[AL.currentContext -1].buf[bufferIdx].buf;
        for (var j = 0; j < AL.contexts[AL.currentContext -1].src.length; ++j) {
          if (buffer == AL.contexts[AL.currentContext -1].src[j].buffer) {
            AL.contexts[AL.currentContext -1].err = 0xA004 /* AL_INVALID_OPERATION  */;
            return;
          }
        }
        delete AL.contexts[AL.currentContext -1].buf[bufferIdx];
      }
    }
  },

  alGenBuffers: function(count, buffers) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alGenBuffers called without a valid context");
#endif
      return;
    }
    for (var i = 0; i < count; ++i) {
      AL.contexts[AL.currentContext -1].buf.push({buf: null});
      {{{ makeSetValue('buffers', 'i*4', 'AL.contexts[AL.currentContext -1].buf.length', 'i32') }}};
    }
  },

  alBufferData: function(buffer, format, data, size, freq) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alBufferData called without a valid context");
#endif
      return;
    }
    if (buffer > AL.contexts[AL.currentContext -1].buf.length) {
#if OPENAL_DEBUG
      console.error("alBufferData called with an invalid buffer");
#endif
      return;
    }
    var channels, bytes;
    switch (format) {
    case 0x1100 /* AL_FORMAT_MONO8 */:
      bytes = 1;
      channels = 1;
      break;
    case 0x1101 /* AL_FORMAT_MONO16 */:
      bytes = 2;
      channels = 1;
      break;
    case 0x1102 /* AL_FORMAT_STEREO8 */:
      bytes = 1;
      channels = 2;
      break;
    case 0x1103 /* AL_FORMAT_STEREO16 */:
      bytes = 2;
      channels = 2;
      break;
    default:
#if OPENAL_DEBUG
      console.error("alBufferData called with invalid format " + format);
#endif
      return;
    }
    AL.contexts[AL.currentContext -1].buf[buffer - 1].buf = AL.contexts[AL.currentContext -1].ctx.createBuffer(channels, size / (bytes * channels), freq);
    var buf = new Array(channels);
    for (var i = 0; i < channels; ++i) {
      buf[i] = AL.contexts[AL.currentContext -1].buf[buffer - 1].buf.getChannelData(i);
    }
    for (var i = 0; i < size / (bytes * channels); ++i) {
      for (var j = 0; j < channels; ++j) {
        switch (bytes) {
        case 1:
          var val = {{{ makeGetValue('data', 'i*channels+j', 'i8') }}};
          buf[j][i] = -1.0 + val * (2/256);
          break;
        case 2:
          var val = {{{ makeGetValue('data', '2*(i*channels+j)', 'i16') }}};
          buf[j][i] = val/32768;
          break;
        }
      }
    }
  },

  alSourcePlay__deps: ["alSourceStop"],
  alSourcePlay: function(source) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourcePlay called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourcePlay called with an invalid source");
#endif
      return;
    }
    var offset = 0;
    if ("src" in AL.contexts[AL.currentContext -1].src[source - 1] &&
        AL.contexts[AL.currentContext -1].src[source - 1]["src"].buffer ==
        AL.contexts[AL.currentContext -1].src[source - 1].buffer) {
      if (AL.contexts[AL.currentContext -1].src[source - 1].paused) {
        // So now we have to resume playback, remember the offset here.
        offset = AL.contexts[AL.currentContext -1].src[source - 1].pausedTime -
                 AL.contexts[AL.currentContext -1].src[source - 1].playTime;
      } else {
        // If the source is already playing, we need to resume from beginning.
        // We do that by stopping the current source and replaying it.
        _alSourceStop(source);
      }
    }
    var src = AL.contexts[AL.currentContext -1].ctx.createBufferSource();
    src.loop = AL.contexts[AL.currentContext -1].src[source - 1].loop;
    src.buffer = AL.contexts[AL.currentContext -1].src[source - 1].buffer;
    src.connect(AL.contexts[AL.currentContext -1].src[source - 1].gain);
    src.start(0, offset);
    AL.contexts[AL.currentContext -1].src[source - 1].playTime = AL.contexts[AL.currentContext -1].ctx.currentTime;
    AL.contexts[AL.currentContext -1].src[source - 1].paused = false;
    AL.contexts[AL.currentContext -1].src[source - 1]['src'] = src;
  },

  alSourceStop: function(source) {
    if (AL.currentContext == 0|| !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourceStop called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourceStop called with an invalid source");
#endif
      return;
    }
    if (AL.contexts[AL.currentContext -1].src[source - 1] && "src" in AL.contexts[AL.currentContext -1].src[source - 1]) {
      AL.contexts[AL.currentContext -1].src[source - 1]["src"].stop(0);
      delete AL.contexts[AL.currentContext -1].src[source - 1]["src"];
    }
  },

  alSourcePause: function(source) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alSourcePause called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alSourcePause called with an invalid source");
#endif
      return;
    }
    if ("src" in AL.contexts[AL.currentContext -1].src[source - 1] &&
        !AL.contexts[AL.currentContext -1].src[source - 1].paused) {
      AL.contexts[AL.currentContext -1].src[source - 1].paused = true;
      AL.contexts[AL.currentContext -1].src[source - 1].pausedTime = AL.contexts[AL.currentContext -1].ctx.currentTime;
      AL.contexts[AL.currentContext -1].src[source - 1]["src"].stop(0);
      delete AL.contexts[AL.currentContext -1].src[source - 1].src;
    }
  },

  alGetSourcei: function(source, param, value) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alGetSourcei called without a valid context");
#endif
      return;
    }
    if (source > AL.contexts[AL.currentContext -1].src.length) {
#if OPENAL_DEBUG
      console.error("alGetSourcei called with an invalid source");
#endif
      return;
    }
    switch (param) {
    case 0x202 /* AL_SOURCE_RELATIVE */:
      // Always return 1
      {{{ makeSetValue('value', '0', '1', 'i32') }}};
      break;
    case 0x1009 /* AL_BUFFER */:
      if (AL.contexts[AL.currentContext -1].src[source - 1].buffer == null) {
        {{{ makeSetValue('value', '0', '0', 'i32') }}};
      } else {
        var buf = AL.contexts[AL.currentContext -1].src[source - 1].buffer;
        for (var i = 0; i < AL.contexts[AL.currentContext -1].buf.length; ++i) {
          if (buf == AL.contexts[AL.currentContext -1].buf[i].buf) {
            {{{ makeSetValue('value', '0', 'i+1', 'i32') }}};
            return;
          }
        }
        {{{ makeSetValue('value', '0', '0', 'i32') }}};
      }
      break;
    case 0x1010 /* AL_SOURCE_STATE */:
      if ("src" in AL.contexts[AL.currentContext -1].src[source - 1]) {
        {{{ makeSetValue('value', '0', '0x1012', 'i32') }}} /* AL_PLAYING */;
      } else if (AL.contexts[AL.currentContext -1].src[source - 1].paused) {
        {{{ makeSetValue('value', '0', '0x1013', 'i32') }}} /* AL_PAUSED */;
      } else if (AL.contexts[AL.currentContext -1].src[source - 1].playTime == -1) {
        {{{ makeSetValue('value', '0', '0x1011', 'i32') }}} /* AL_INITIAL */;
      } else {
        {{{ makeSetValue('value', '0', '0x1014', 'i32') }}} /* AL_STOPPED */;
      }
      break;
    case 0x1015 /* AL_BUFFERS_QUEUED */:
      if (AL.contexts[AL.currentContext -1].src[source - 1].buffer) {
        {{{ makeSetValue('value', '0', '1', 'i32') }}}
      } else {
        {{{ makeSetValue('value', '0', '0', 'i32') }}}
      }
      break;
    case 0x1016 /* AL_BUFFERS_PROCESSED */:
      // Always return 1
      {{{ makeSetValue('value', '0', '1', 'i32') }}}
      break;
    }
  },

  alDistanceModel: function(model) {
    if (model != 0 /* AL_NONE */) {
#if OPENAL_DEBUG
      console.log("Only alDistanceModel(AL_NONE) is currently supported");
#endif
    }
  },

  alListenerfv: function(param, values) {
    if (AL.currentContext == 0 || !AL.contexts[AL.currentContext -1]) {
#if OPENAL_DEBUG
      console.error("alListenerfv called without a valid context");
#endif
      return;
    }
    switch (param) {
    case 0x1004 /* AL_POSITION */:
      AL.contexts[AL.currentContext -1].ctx.listener.setPosition(
          {{{ makeGetValue('values', '0', 'float') }}},
          {{{ makeGetValue('values', '4', 'float') }}},
          {{{ makeGetValue('values', '8', 'float') }}}
        );
      break;
    case 0x1006 /* AL_VELOCITY */:
      AL.contexts[AL.currentContext -1].ctx.listener.setVelocity(
          {{{ makeGetValue('values', '0', 'float') }}},
          {{{ makeGetValue('values', '4', 'float') }}},
          {{{ makeGetValue('values', '8', 'float') }}}
        );
      break;
    case 0x100F /* AL_ORIENTATION */:
      AL.contexts[AL.currentContext -1].ctx.listener.setOrientation(
          {{{ makeGetValue('values', '0', 'float') }}},
          {{{ makeGetValue('values', '4', 'float') }}},
          {{{ makeGetValue('values', '8', 'float') }}},
          {{{ makeGetValue('values', '12', 'float') }}},
          {{{ makeGetValue('values', '16', 'float') }}},
          {{{ makeGetValue('values', '20', 'float') }}}
        );
      break;
    default:
#if OPENAL_DEBUG
      console.log("alListenerfv with param " + param + " not implemented yet");
#endif
      break;
    }
  },

  alIsExtensionPresent: function(extName) {
    return 0;
  },

  alcIsExtensionPresent: function(device, extName) {
    return 0;
  },

  alGetProcAddress: function(fname) {
    return 0;
  },

  alcGetProcAddress: function(device, fname) {
    return 0;
  },
  
  alSourceRewind: function(source) {
  
  }
};

autoAddDeps(LibraryOpenAL, '$AL');
mergeInto(LibraryManager.library, LibraryOpenAL);

