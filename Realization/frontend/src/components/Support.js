import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import i18n from '../i18n';
import { FaExpand } from 'react-icons/fa';

function usePrefersDark() {
  const [dark, setDark] = React.useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

const Support = () => {
  const history = useHistory();
  const t = i18n.t.bind(i18n);
  const textareaRef = useRef(null);

  const [lang, setLang] = useState(i18n.language || localStorage.getItem('appLang') || 'en');
  const [message, setMessage] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('Text');
  const [showInvisibleChars, setShowInvisibleChars] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  const emojiButtonRef = useRef(null);
  const [emojiPosition, setEmojiPosition] = useState({ top: 0, left: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || null); // null=auto, 'dark', 'light'
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;

  const availableLangs = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'de', label: 'DE' },
    { code: 'es', label: 'ES' },
    { code: 'pt', label: 'PT' },
    { code: 'uk', label: 'UK' },
    { code: 'zh', label: 'ZH' },
    { code: 'be', label: 'BE' },
  ];

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('appLang', code);
    // Не надо setLang здесь — обновится через событие languageChanged
  };

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (message.trim().length === 0) {
      setError(t('support.messageEmpty') || 'Сообщение не может быть пустым');
      return;
    }
    if (message.length > 2000) {
      setError(t('support.messageTooLong') || 'Сообщение слишком длинное');
      return;
    }
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('Необходимо войти в систему для отправки сообщения');
        setLoading(false);
        return;
      }
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: 'Support Message from User',
          text: message,
        }),
      });
      if (response.ok) {
        setSuccess(t('support.messageSentSuccess') || 'Сообщение успешно отправлено!');
        setMessage('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('support.messageSendFailed') || 'Ошибка отправки сообщения');
      }
    } catch (err) {
      setError(t('support.messageSendFailed') || 'Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const insertTag = (startTag, endTag = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.substring(start, end);
    const before = message.substring(0, start);
    const after = message.substring(end);
    const newText = before + startTag + selected + endTag + after;
    setMessage(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 0);
  };

  const insertLink = () => {
    if (linkName && linkUrl) {
      const linkTag = `<a href='${linkUrl}'>${linkName}</a>`;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = message.substring(start, end);
      const before = message.substring(0, start);
      const after = message.substring(end);
      const newText = before + linkTag + after;
      setMessage(newText);
      setLinkDialogOpen(false);
      setLinkName('');
      setLinkUrl('');
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const imgTag = `<img src='${imageUrl}' alt='Image' style='max-width: 100%;' />`;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = message.substring(0, start);
      const after = message.substring(end);
      const newText = before + imgTag + after;
      setMessage(newText);
      setImageDialogOpen(false);
      setImageUrl('');
      setImageFile(null);
    } else if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgTag = `<img src='${e.target.result}' alt='${imageFile.name}' style='max-width: 100%;' />`;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = message.substring(0, start);
        const after = message.substring(end);
        const newText = before + imgTag + after;
        setMessage(newText);
      };
      reader.readAsDataURL(imageFile);
      setImageDialogOpen(false);
      setImageUrl('');
      setImageFile(null);
    }
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl('');
    }
  };

  const insertCode = () => {
    if (codeContent) {
      const codeTag = `<pre><code language='${codeLanguage.toLowerCase()}'>${codeContent}</code></pre>`;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = message.substring(0, start);
      const after = message.substring(end);
      const newText = before + codeTag + after;
      setMessage(newText);
      setCodeDialogOpen(false);
      setCodeContent('');
      setCodeLanguage('Text');
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = message.substring(0, start);
    const after = message.substring(end);
    const newText = before + emoji + after;
    setMessage(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const toggleEmojiDialog = () => {
    if (!emojiDialogOpen) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dialogHeight = 400; // Approximate height of the dialog
      const dialogWidth = 450; // Approximate width of the dialog
      let top = rect.top - dialogHeight - 10; // Try to position above by default
      let left = rect.left;
      // Adjust top if it goes off-screen
      if (top < 0) {
        top = rect.bottom + 10; // Position below if not enough space above
      }
      if (top + dialogHeight > viewportHeight) {
        top = viewportHeight - dialogHeight - 10; // Adjust to fit within viewport
      }
      // Adjust left if it goes off-screen
      if (left + dialogWidth > viewportWidth) {
        left = viewportWidth - dialogWidth - 10; // Adjust to fit within viewport
      }
      if (left < 0) {
        left = 10; // Ensure it doesn't go off the left edge
      }
      setEmojiPosition({ top, left });
    }
    setEmojiDialogOpen(!emojiDialogOpen);
  };

  // Подписка на событие смены языка
  useEffect(() => {
    const onLanguageChanged = (lng) => {
      setLang(lng);
    };

    i18n.on('languageChanged', onLanguageChanged);

    // Инициализация языка при монтировании
    setLang(i18n.language);

    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  // 1. Добавляю emojiNameMap для поиска по названию
  const emojiNameMap = {
    '😀': ['grinning face', 'улыбка', 'улыбается', 'smile'],
    '😁': ['beaming face', 'улыбка', 'улыбается', 'smile'],
    '😂': ['face with tears of joy', 'смех', 'радость', 'joy', 'lol'],
    '🤣': ['rolling on the floor laughing', 'ржу', 'смех', 'lol'],
    '😃': ['smiling face with open mouth', 'улыбка', 'улыбается', 'smile'],
    '😄': ['smiling face with open mouth & smiling eyes', 'улыбка', 'улыбается', 'smile'],
    '😅': ['smiling face with sweat', 'улыбка', 'пот', 'smile', 'sweat'],
    '😆': ['smiling face with closed eyes', 'улыбка', 'улыбается', 'смех', 'smile'],
    '😉': ['winking face', 'подмигивание', 'wink'],
    '😊': ['smiling face with smiling eyes', 'улыбка', 'улыбается', 'smile'],
    '😋': ['face savoring food', 'вкусно', 'еда', 'yum', 'food'],
    '😎': ['smiling face with sunglasses', 'круто', 'очки', 'cool', 'sunglasses'],
    '😍': ['heart eyes', 'влюблен', 'любовь', 'love', 'heart'],
    '😘': ['face blowing a kiss', 'поцелуй', 'kiss'],
    '🥰': ['smiling face with hearts', 'влюблен', 'любовь', 'love', 'hearts'],
    '😗': ['kissing face', 'поцелуй', 'kiss'],
    '😙': ['kissing face with smiling eyes', 'поцелуй', 'улыбка', 'kiss', 'smile'],
    '😚': ['kissing face with closed eyes', 'поцелуй', 'улыбка', 'kiss', 'smile'],
    '🙂': ['slightly smiling face', 'улыбка', 'улыбается', 'smile'],
    '🤗': ['hugging face', 'обнимает', 'объятия', 'hug'],
    '🤩': ['star-struck', 'звезда', 'восторг', 'звёзды', 'star'],
    '🤔': ['thinking face', 'думает', 'think'],
    '🤨': ['face with raised eyebrow', 'сомнение', 'сомневается', 'raise eyebrow'],
    '😐': ['neutral face', 'нейтрально', 'neutral'],
    '😑': ['expressionless face', 'без эмоций', 'expressionless'],
    '😶': ['face without mouth', 'молчит', 'без рта', 'silent'],
    '🙄': ['face with rolling eyes', 'закатывает глаза', 'roll eyes'],
    '😏': ['smirking face', 'ухмылка', 'smirk'],
    // ... (добавьте остальные эмодзи по желанию)
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    const onStorage = (e) => {
      if (e.key === 'theme') setTheme(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [theme, dark]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <select
          aria-label="Select language"
          value={lang}
          onChange={(e) => handleLangChange(e.target.value)}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            border: `1px solid rgb(0, 123, 255)`,
            background: 'white',
            color: 'rgb(0, 123, 255)',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: '10px',
            fontSize: '1rem',
          }}
        >
          {availableLangs.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#3976a8',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: '0.3s',
            marginRight: 10,
          }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {dark ? t('navbar.light_mode') : t('navbar.dark_mode')}
        </button>
        <button
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: 'rgb(0, 123, 255)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
          onClick={() => history.push('/')}
        >
          {t('support.backToMain')}
        </button>
      </div>
      <h1>{t('support.title')}</h1>
      <p>{t('support.description')}</p>
      <p>{t('support.messageInfo')}</p>
      <div style={{ marginTop: '20px' }}>
        <label htmlFor="supportMessage" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          {t('support.enterMessage')}
        </label>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          {/* Кнопки форматирования слева */}
          <div
            style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              zIndex: 1,
              display: 'flex',
              gap: '4px',
            }}
          >
            <button title="Bold" onClick={() => insertTag('<strong>', '</strong>')}>
              𝐁
            </button>
            <button title="Italic" onClick={() => insertTag('<em>', '</em>')}>
              𝑰
            </button>
            <button title="Underline" onClick={() => insertTag('<u>', '</u>')}>
              U̲
            </button>
            <button title="Strikethrough" onClick={() => insertTag('<s>', '</s>')}>
              S̶
            </button>
            <button title="Emoji" ref={emojiButtonRef} onClick={toggleEmojiDialog}>
              😊
            </button>
            <button title="Link" onClick={() => setLinkDialogOpen(true)}>🔗</button>
            <button title="Image" onClick={() => setImageDialogOpen(true)}>🖼️</button>
            <button title="Code" onClick={() => setCodeDialogOpen(true)}>&lt;/&gt;</button>
          </div>
          {/* Кнопка "Увеличить" справа */}
          <div style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 1 }}>
            <button
              title="Увеличить"
              onClick={() => setFullscreen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <FaExpand size={20} color={dark ? '#ffe082' : '#3976a8'} />
            </button>
          </div>
          {/* Счетчик символов */}
          <div style={{ position: 'absolute', bottom: '5px', right: '10px', fontSize: '0.8rem', color: message.length > 2000 ? 'red' : 'inherit' }}>
            {message.length}/2000
          </div>
          <textarea
            id="supportMessage"
            ref={textareaRef}
            placeholder={t('support.placeholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '40px 10px 25px 10px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              resize: 'vertical',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: '0.5rem 2rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            disabled={loading}
          >
            {loading ? (t('support.sending') || 'Отправка...') : (t('support.send') || 'Отправить')}
          </button>
        </div>
        {success && <div style={{ color: '#27ae60', fontWeight: 500, marginTop: 12 }}>{success}</div>}
        {error && <div style={{ color: '#e74c3c', fontWeight: 500, marginTop: 12 }}>{error}</div>}
      </div>

      {/* Полноэкранный редактор */}
      {fullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setFullscreen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              width: '95%',
              height: '90%',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2 style={{ marginBottom: '10px' }}>{t('support.enhancedEditor') || 'Редактор'}</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('support.placeholder')}
              style={{
                flex: 1,
                width: '100%',
                fontSize: '1rem',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'none',
              }}
            />
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button
                onClick={() => setFullscreen(false)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                }}
              >
                {t('support.close') || 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {linkDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setLinkDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              width: '400px',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setLinkDialogOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <h2>{t('support.insertLinkTitle')}</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('support.linkName')}</label>
              <input
                type="text"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('support.linkUrl')}</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setLinkDialogOpen(false)}
                style={{
                  backgroundColor: '#ccc',
                  color: 'black',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                {t('support.cancel')}
              </button>
              <button
                onClick={insertLink}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                }}
              >
                {t('support.insert')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {imageDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setImageDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              width: '400px',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setImageDialogOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <h2>{t('support.insertImageTitle')}</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('support.imageUrl')}</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageFile(null);
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <span style={{ display: 'block', marginBottom: '5px' }}>{t('support.or')}</span>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="support-upload-image" style={{ display: 'block', marginBottom: '5px' }}>{t('support.uploadImage')}</label>
              <input
                id="support-upload-image"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                style={{ width: '100%', padding: '8px 0' }}
              />
              {imageFile && <p style={{ marginTop: '5px' }}>Selected: {imageFile.name}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setImageDialogOpen(false)}
                style={{
                  backgroundColor: '#ccc',
                  color: 'black',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                {t('support.cancel')}
              </button>
              <button
                onClick={insertImage}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                }}
              >
                {t('support.insert')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Dialog */}
      {codeDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setCodeDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              width: '500px',
              height: '400px',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button
              onClick={() => setCodeDialogOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <h2>{t('support.insertCodeTitle')}</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('support.codeLanguage')}</label>
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                {['Java', 'Python', 'Markdown', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'JSON', 'YAML', 'XML', 'SQL', 'PL/SQL', 'Groovy', 'Kotlin', 'Dockerfile', 'Text'].map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={showInvisibleChars}
                  onChange={() => setShowInvisibleChars(!showInvisibleChars)}
                  style={{ marginRight: '5px' }}
                />
                {t('support.showInvisibleChars')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={() => setShowLineNumbers(!showLineNumbers)}
                  style={{ marginRight: '5px' }}
                />
                {t('support.showLineNumbers')}
              </label>
            </div>
            <div style={{ flex: 1, marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('support.codeContent')}</label>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                style={{ width: '100%', height: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none', fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setCodeDialogOpen(false)}
                style={{
                  backgroundColor: '#ccc',
                  color: 'black',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                {t('support.cancel')}
              </button>
              <button
                onClick={insertCode}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                }}
              >
                {t('support.insert')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Dialog */}
      {emojiDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: emojiPosition.top,
            left: emojiPosition.left,
            backgroundColor: 'white',
            width: '338px',
            height: '300px',
            padding: '8px',
            borderRadius: '6px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem' }}>{t('support.selectEmoji')}</h3>
            <button
              onClick={() => setEmojiDialogOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0 3px',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder={t('support.searchEmoji')}
              value={emojiSearch}
              onChange={(e) => setEmojiSearch(e.target.value)}
              style={{ width: '100%', padding: '3px', border: '1px solid #ccc', borderRadius: '4.5px', fontSize: '1.2rem' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {emojiSearch !== ''
                ? Object.values({
                    smileys: [
                      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', 
                      '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', 
                      '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', 
                      '😕', '🙃', '🤑', '😲', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😰', 
                      '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', 
                      '🤧', '😇', '🥳', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '🤡', '👶', '🧒', 
                      '👦', '👧', '🧑', '👨', '👩', '🧔', '👱', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', 
                      '🙋', '🧎', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', 
                      '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', 
                      '🧟', '💆', '💇', '🚶', '🧍', '💃', '🕺', '🕴️', '👯', '🧖', '🧗', '🤺', '🏇', '⛷️', 
                      '🏂', '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹', '🧘', 
                      '🛀', '🛌'
                    ],
                    animals: [
                      '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', 
                      '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', 
                      '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', 
                      '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', 
                      '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', 
                      '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🦖', '🦕', '🦂', '🕷️', '🕸️', '🐌', '🦋', '🐛', 
                      '🐜', '🐝', '🐞', '🦗', '🦟', '🦠', '🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦞', 
                      '🦀', '🦐', '🦪', '🐳', '🐋', '🐬', '🌵', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', 
                      '🍀', '🍁', '🍂', '🍃', '🌷', '🌸', '💐', '🌹', '🥀', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', 
                      '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', 
                      '🥝', '🍅', '🥥'
                    ],
                    food: [
                      '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓',  
                      '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', 
                      '🧅', '🍄', '🥜', '🌰', '🍞', '🧀', '🥚', '🍗', '🍖', '🦴', '🍗', '🥩', '🥓', '🍔', '🍟', 
                      '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍲', '🍜', '🍝', '🍠', '🍣', 
                      '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦞', '🦪', '🦀', '🦐', '🦑', '🍦', '🍧', '🍨', 
                      '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', 
                      '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', 
                      '🍴', '🥄', '🔪', '🧂'
                    ],
                    activities: [
                      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', 
                      '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', 
                      '⛸️', '🥌', '🎿', '⛷️', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏇', '🚴', '🚵', 
                      '🤹', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', 
                      '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🧩', '🧸',
                      '🎰', '🎮', '🎳', '🎯', '🎱', '🔮', '🎖️', '🏆', '🥇', '🥈', '🥉', '🏅'
                    ],
                    travel: [
                      '🚗', '🚕', '🚖', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', 
                      '🦽', '🦼', '🛵', '🚲', '🛴', '🛹', '🚏', '🚤', '🛢️', '⛽', '🚨', '🚥', '🚦', 
                      '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', 
                      '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⛺', '🏖️', '🏜️', '🏝️', 
                      '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', 
                      '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', 
                      '🛕', '🕍', '⛩️', '🕋', '⛲', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', 
                      '🎡', '🎢', '💈', '🎪'
                    ],
                    objects: [
                      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', 
                      '🧮', '🎥', '🎞️', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🔬', '🔭', '📡', 
                      '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', 
                      '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '💴', '💵', '💶', '💷', '💸', '💳', 
                      '🧾', '💹', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', 
                      '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗃️', '🗄️', '🗑️', '🔒', 
                      '🔓', '🔏', '🔐', '🔑', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🏹', 
                      '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', 
                      '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', 
                      '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', 
                      '🧽', '🧯', '🛒'
                    ],
                    symbols: [
                      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💘', '💓', '💔', '💕', '💖', '💗', 
                      '💝', '💞', '💟', '❣️', '💌', '💤', '💢', '💣', '💥', '💦', '💨', '💫', '💬', '🗨️', '🗯️', 
                      '💭', '🕳️', '👁️‍🗨️', '🗣️', '👤', '👥', '👣', '🖖', '👌', '🤏', '✌️', '🤞',  
                      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤎', 
                      '👏', '🫶', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', 
                      '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '💯', 
                      '❌', '⭕', '✅', '✔️', '❎', '➕', '➖', '➗', '✖️', '♾️', '‼️', '⁉️', '❓', '❔', '❕', 
                      '❗', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔰', '⛎', '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🌞', 
                      '🌝', '🌛', '🌜', '🌎', '🌍', '🌏', '🌕', '🌑', '🌒', '🌓', '🌔', '🌖', '🌗', '🌘', '🌙', '🌚', 
                      '🌤️', '⛅', '🌥️', '⛈️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☔', 
                      '⛱️', '⚽', '⚾', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', 
                      '🥊', '🥋', '🎯', '⛳', '⛸️', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', 
                      '🧧', '🎎', '🎏', '🎐', '🧨', '🎊', '🎋', '🎉', '🎈', '🎌', '🎀', '🎁', '🎗️', '🎟️', 
                      '🎖️', '🏆', '🥇', '🥈', '🥉', '🏅'
                    ]
                  })
                    .flat()
                    .filter((emoji) => {
                      const search = emojiSearch.toLowerCase();
                      const names = emojiNameMap[emoji] || [];
                      return emoji.includes(search) || names.some(n => n.includes(search));
                    })
                    .map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        style={{
                          fontSize: '1.05rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '3px',
                          textAlign: 'center',
                          borderRadius: '5px',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = '#f0f0f0')}
                        onMouseOut={e => (e.currentTarget.style.background = 'none')}
                      >
                        {emoji}
                      </button>
                    ))
                : (
                  (activeEmojiTab === 'smileys' ? [
                    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', 
                    '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', 
                    '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', 
                    '😕', '🙃', '🤑', '😲', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😰', 
                    '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', 
                    '🤧', '😇', '🥳', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '🤡', '👶', '🧒', 
                    '👦', '👧', '🧑', '👨', '👩', '🧔', '👱', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', 
                    '🙋', '🧎', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', 
                    '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', 
                    '🧟', '💆', '💇', '🚶', '🧍', '💃', '🕺', '🕴️', '👯', '🧖', '🧗', '🤺', '🏇', '⛷️', 
                    '🏂', '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹', '🧘', 
                    '🛀', '🛌'
                  ] : activeEmojiTab === 'animals' ? [
                    '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', 
                    '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', 
                    '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', 
                    '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', 
                    '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', 
                    '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🦖', '🦕', '🦂', '🕷️', '🕸️', '🐌', '🦋', '🐛', 
                    '🐜', '🐝', '🐞', '🦗', '🦟', '🦠', '🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦞', 
                    '🦀', '🦐', '🦪', '🐳', '🐋', '🐬', '🌵', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', 
                    '🍀', '🍁', '🍂', '🍃', '🌷', '🌸', '💐', '🌹', '🥀', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', 
                    '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', 
                    '🥝', '🍅', '🥥'
                  ] : activeEmojiTab === 'food' ? [
                    '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓',  
                    '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', 
                    '🧅', '🍄', '🥜', '🌰', '🍞', '🧀', '🥚', '🍗', '🍖', '🦴', '🍗', '🥩', '🥓', '🍔', '🍟', 
                    '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍲', '🍜', '🍝', '🍠', '🍣', 
                    '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦞', '🦪', '🦀', '🦐', '🦑', '🍦', '🍧', '🍨', 
                    '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', 
                    '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', 
                    '🍴', '🥄', '🔪', '🧂'
                  ] : activeEmojiTab === 'activities' ? [
                    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', 
                    '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', 
                    '⛸️', '🥌', '🎿', '⛷️', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏇', '🚴', '🚵', 
                    '🤹', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', 
                    '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🧩', '🧸',
                    '🎰', '🎮', '🎳', '🎯', '🎱', '🔮', '🎖️', '🏆', '🥇', '🥈', '🥉', '🏅'
                  ] : activeEmojiTab === 'travel' ? [
                    '🚗', '🚕', '🚖', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', 
                    '🦽', '🦼', '🛵', '🚲', '🛴', '🛹', '🚏', '🚤', '🛢️', '⛽', '🚨', '🚥', '🚦', 
                    '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', 
                    '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⛺', '🏖️', '🏜️', '🏝️', 
                    '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', 
                    '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', 
                    '🛕', '🕍', '⛩️', '🕋', '⛲', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', 
                    '🎡', '🎢', '💈', '🎪'
                  ] : activeEmojiTab === 'objects' ? [
                    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', 
                    '🧮', '🎥', '🎞️', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🔬', '🔭', '📡', 
                    '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', 
                    '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '💴', '💵', '💶', '💷', '💸', '💳', 
                    '🧾', '💹', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', 
                    '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗃️', '🗄️', '🗑️', '🔒', 
                    '🔓', '🔏', '🔐', '🔑', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🏹', 
                    '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', 
                    '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', 
                    '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', 
                    '🧽', '🧯', '🛒'
                  ] : activeEmojiTab === 'symbols' ? [
                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💘', '💓', '💔', '💕', '💖', '💗', 
                    '💝', '💞', '💟', '❣️', '💌', '💤', '💢', '💣', '💥', '💦', '💨', '💫', '💬', '🗨️', '🗯️', 
                    '💭', '🕳️', '👁️‍🗨️', '🗣️', '👤', '👥', '👣', '🖖', '👌', '🤏', '✌️', '🤞',  
                    '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤎', 
                    '👏', '🫶', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', 
                    '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '💯', 
                    '❌', '⭕', '✅', '✔️', '❎', '➕', '➖', '➗', '✖️', '♾️', '‼️', '⁉️', '❓', '❔', '❕', 
                    '❗', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔰', '⛎', '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🌞', 
                    '🌝', '🌛', '🌜', '🌎', '🌍', '🌏', '🌕', '🌑', '🌒', '🌓', '🌔', '🌖', '🌗', '🌘', '🌙', '🌚', 
                    '🌤️', '⛅', '🌥️', '⛈️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☔', 
                    '⛱️', '⚽', '⚾', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', 
                    '🥊', '🥋', '🎯', '⛳', '⛸️', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', 
                    '🧧', '🎎', '🎏', '🎐', '🧨', '🎊', '🎋', '🎉', '🎈', '🎌', '🎀', '🎁', '🎗️', '🎟️', 
                    '🎖️', '🏆', '🥇', '🥈', '🥉', '🏅'
                  ] : [])
                ).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    style={{
                      fontSize: '1.05rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      textAlign: 'center',
                      borderRadius: '5px',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#f0f0f0')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  >
                    {emoji}
                  </button>
                ))
              }
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid #eee', paddingTop: '8px', flexWrap: 'nowrap', overflowX: 'auto', gap: '4px', justifyContent: 'center' }}>
            <button 
              onClick={() => setActiveEmojiTab('smileys')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'smileys' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'smileys' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiSmileys')}
            >
              😃
            </button>
            <button 
              onClick={() => setActiveEmojiTab('animals')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'animals' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'animals' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiAnimals')}
            >
              🐻
            </button>
            <button 
              onClick={() => setActiveEmojiTab('food')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'food' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'food' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiFood')}
            >
              🍔
            </button>
            <button 
              onClick={() => setActiveEmojiTab('activities')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'activities' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'activities' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiActivities')}
            >
              ⚽
            </button>
            <button 
              onClick={() => setActiveEmojiTab('travel')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'travel' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'travel' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiTravel')}
            >
              🚖
            </button>
            <button 
              onClick={() => setActiveEmojiTab('objects')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'objects' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'objects' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiObjects')}
            >
              💡
            </button>
            <button 
              onClick={() => setActiveEmojiTab('symbols')}
              style={{
                padding: '3px 8px',
                background: activeEmojiTab === 'symbols' ? '#eee' : 'none',
                border: 'none',
                borderBottom: activeEmojiTab === 'symbols' ? '3px solid #007bff' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                minWidth: '32px',
              }}
              title={t('support.emojiSymbols')}
            >
              ❤️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
