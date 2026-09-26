const fs = require('fs');
const file = 'src/pages/Student/Components/ST_AiInterview.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the start of the live grid and the end of the live phase
const liveGridStart = content.indexOf('<div className="ai-live-grid">');
const livePhaseEnd = content.indexOf('      )}\n\n      {/* ─── RESULT PHASE');
const livePhaseEnd2 = content.indexOf('      )}\r\n\r\n      {/* ─── RESULT PHASE');

const endIdx = livePhaseEnd !== -1 ? livePhaseEnd + 9 : livePhaseEnd2 + 10;

if (liveGridStart === -1) {
  console.error('Could not find ai-live-grid');
  process.exit(1);
}

console.log('liveGridStart:', liveGridStart);
console.log('livePhaseEnd:', livePhaseEnd, livePhaseEnd2);

const before = content.slice(0, liveGridStart);
const after = content.slice(endIdx);

const newLiveSection = `<div className="ai-live-grid" style={{ gridTemplateColumns: '260px 1fr', gap: '16px' }}>
            {/* ── LEFT COLUMN: Webcam + AI status ── */}
            <div className="ai-left-column">
              <div className={\`ai-camera-panel \${cameraState === "on" ? "" : "ai-camera-off-panel"}\`}>
                {cameraState === "on" ? (
                  <video ref={videoRef} className="ai-camera-video" autoPlay playsInline muted />
                ) : (
                  <div className="ai-camera-placeholder">
                    {cameraState === "denied" ? (
                      <>
                        <XCircle size={32} />
                        <span>Camera permission denied</span>
                      </>
                    ) : cameraState === "unsupported" ? (
                      <>
                        <XCircle size={32} />
                        <span>Camera not supported</span>
                      </>
                    ) : (
                      <>
                        <Video size={32} />
                        <span>Camera Off</span>
                      </>
                    )}
                  </div>
                )}
                <div className="ai-camera-controls-bar">
                  <button
                    type="button"
                    className={\`ai-cam-ctrl-btn \${cameraState === "on" ? "active" : ""}\`}
                    onClick={toggleCamera}
                    title={cameraState === "on" ? "Turn Camera Off" : "Turn Camera On"}
                  >
                    {cameraState === "on" ? <Camera size={14} /> : <CameraOff size={14} />}
                    <span>{cameraState === "on" ? "Camera ON" : "Camera OFF"}</span>
                  </button>
                  {SpeechRecognitionCtor && (
                    <button
                      type="button"
                      className={\`ai-cam-ctrl-btn \${isRecording ? "active recording" : ""}\`}
                      onClick={toggleRecording}
                      disabled={!question || isEvaluating}
                      title={isRecording ? "Stop Microphone" : "Start Microphone"}
                    >
                      {isRecording ? <Mic size={14} /> : <MicOff size={14} />}
                      <span>{isRecording ? "Mic ON" : "Mic OFF"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Interviewer status card */}
              <div className="interview-practice-card" style={{ padding: '14px 16px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="ai-interviewer-avatar" style={{ width: 36, height: 36, minWidth: 36 }}>
                    <Bot size={18} color="#ffffff" />
                    {isAiSpeaking && <span className="ai-avatar-speaking" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ai-interviewer-name" style={{ fontSize: '13px' }}>AI Interviewer</div>
                    <div className="ai-interviewer-sub" style={{ fontSize: '11px' }}>
                      {isEvaluating ? (
                        <span className="ai-speaking-lbl"><Loader2 size={10} className="ai-spin" /> Thinking...</span>
                      ) : isAiSpeaking ? (
                        <span className="ai-speaking-lbl">Speaking...</span>
                      ) : question ? (
                        <span className="ai-waves-lbl">Listening</span>
                      ) : (
                        <span className="ai-waves-lbl">Starting...</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={\`ai-speaker-play-btn \${!voiceEnabled ? "voice-disabled" : ""}\`}
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      voiceEnabledRef.current = next;
                      if (!next) stopSpeaking();
                      else if (question?.question) speakQuestion(question.question);
                    }}
                    title={voiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
                  >
                    {voiceEnabled ? (
                      <Volume2 size={16} className={\`ai-speak-icon \${isAiSpeaking ? "speaking-pulse" : ""}\`} />
                    ) : (
                      <VolumeX size={16} className="muted-icon" />
                    )}
                  </button>
                </div>
                {isAiSpeaking && (
                  <div className="ai-voice-waves ai-waves-inline" style={{ marginTop: '10px' }}>
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: Unified chat thread ── */}
            <div className="interview-practice-card ai-interviewer-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '480px', padding: '20px' }}>
              {/* Scrollable chat history */}
              <div className="ai-conversation" style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div className="ai-conv-title">Conversation</div>
                {conversation.length === 0 ? (
                  <div className="ai-conv-empty">
                    <Loader2 size={20} className="ai-spin" style={{ marginBottom: 8 }} />
                    Waiting for the first question...
                  </div>
                ) : (
                  <div className="ai-conv-list">
                    {conversation.map((c, idx) => {
                      if (c.type === "q") {
                        return (
                          <div className="ai-bubble ai-bubble-ai" key={idx}>
                            <span className="ai-bubble-tag">Q{c.index}</span>
                            <span>{c.text}</span>
                          </div>
                        );
                      }
                      if (c.type === "a") {
                        return (
                          <div className="ai-bubble ai-bubble-user" key={idx}>
                            {c.text}
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div ref={conversationEndRef} />
                  </div>
                )}
              </div>

              {/* Inline answer input at the bottom */}
              <div style={{ flexShrink: 0 }}>
                {isRecording && (
                  <div className="ai-listening-indicator" style={{ marginBottom: '8px' }}>
                    <span className="ai-listening-dot" /> Listening — speak now...
                  </div>
                )}
                <textarea
                  className="interview-textarea ai-answer-textarea"
                  style={{ width: '100%', minHeight: '90px', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }}
                  placeholder={
                    !question
                      ? "Waiting for the AI question..."
                      : SpeechRecognitionCtor
                      ? "Speak via mic or type your answer here..."
                      : "Type your answer here..."
                  }
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!question || isEvaluating}
                />
                <div className="interview-action-row" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                  {SpeechRecognitionCtor && (
                    <button
                      type="button"
                      className={\`ai-mic-btn \${isRecording ? "recording" : ""}\`}
                      onClick={toggleRecording}
                      disabled={!question || isEvaluating}
                      title={isRecording ? "Stop Listening" : "Start Voice Typing"}
                    >
                      {isRecording ? <Mic size={15} /> : <MicOff size={15} />}
                      <span>{isRecording ? "Listening..." : "Voice Input"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    id="submit-answer-btn"
                    className="interview-next-btn"
                    onClick={sendAnswer}
                    disabled={!answer.trim() || isEvaluating || !socketConnected || !question}
                  >
                    {isEvaluating ? (
                      <><Loader2 size={15} className="ai-spin" /> Evaluating...</>
                    ) : (
                      <>Submit Answer <Send size={15} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

`;

content = before + newLiveSection + after;
fs.writeFileSync(file, content);
console.log('done, lines:', content.split('\n').length);
