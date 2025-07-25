// SimpleCaptchaModal.js
import React, { useState, useEffect } from 'react';

export default function SimpleCaptchaModal({ isOpen, onClose, onSuccess }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateQuestion();
      setAnswer('');
      setError('');
    }
  }, [isOpen]);

  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    setQuestion(`${a} + ${b}`);
    setCorrectAnswer(a + b);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
      <div style={{ background:'#fff', borderRadius:8, padding:24, width:'90%', maxWidth:360, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginTop:0, marginBottom:12, fontSize:20, textAlign:'center' }}>Подтверждение</h3>
        <p style={{ marginBottom:12, fontSize:16, textAlign:'center' }}>Решите пример, чтобы подтвердить, что вы не робот:</p>
        <div style={{ textAlign:'center', fontSize:22, fontWeight:600, marginBottom:12 }}>{question} = ?</div>
        <input
          type="number"
          value={answer}
          onChange={e=>setAnswer(e.target.value)}
          style={{ width:'100%', padding:8, fontSize:16, borderRadius:6, border:'1.5px solid #eaeaea', marginBottom:8 }}
        />
        {error && <div style={{ color:'#e74c3c', fontSize:14, marginBottom:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'#ccc', border:'none', padding:'8px 16px', borderRadius:6, fontSize:15 }}>Отмена</button>
          <button onClick={()=>{
            if(Number(answer)===correctAnswer){
              onSuccess();
              onClose();
            } else {
              setError('Неверно. Попробуйте ещё.');
              generateQuestion();
            }
          }} style={{ background:'#54ad54', color:'#fff', border:'none', padding:'8px 16px', borderRadius:6, fontSize:15 }}>Подтвердить</button>
        </div>
      </div>
    </div>
  );
} 