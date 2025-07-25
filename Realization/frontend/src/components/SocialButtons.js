import React from 'react';
import './SocialButtons.css';

const SocialButtons = ({ onSocialClick }) => {
  const scrollContainer = React.useRef(null);

  const scroll = (direction) => {
    if (scrollContainer.current) {
      const scrollAmount = 200;
      scrollContainer.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="social-buttons-container">
      <button 
        className="scroll-button left" 
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      
      <div className="social-buttons-scroll" ref={scrollContainer}>
        <button type="button" className="btn btn-vk" title="VK" onClick={() => onSocialClick('vk')}>
          <i className="fab fa-vk"></i>
        </button>
        <button type="button" className="btn btn-yandex" title="Yandex" onClick={() => onSocialClick('yandex')}>
          <i className="fab fa-yandex"></i>
        </button>
        <button type="button" className="btn btn-odnoklassniki" title="Odnoklassniki" onClick={() => onSocialClick('odnoklassniki')}>
          <i className="fab fa-odnoklassniki"></i>
        </button>
        <button type="button" className="btn btn-mailru" title="Mail.ru" onClick={() => onSocialClick('mailru')}>
          <i className="fas fa-at"></i>
        </button>
        <button type="button" className="btn btn-google" title="Google" onClick={() => onSocialClick('google')}>
          <i className="fab fa-google"></i>
        </button>
        <button type="button" className="btn btn-facebook" title="Facebook" onClick={() => onSocialClick('facebook')}>
          <i className="fab fa-facebook-f"></i>
        </button>
        <button type="button" className="btn btn-instagram" title="Instagram" onClick={() => onSocialClick('instagram')}>
          <i className="fab fa-instagram"></i>
        </button>
        <button type="button" className="btn btn-linkedin" title="LinkedIn" onClick={() => onSocialClick('linkedin')}>
          <i className="fab fa-linkedin-in"></i>
        </button>
        <button type="button" className="btn btn-github" title="GitHub" onClick={() => onSocialClick('github')}>
          <i className="fab fa-github"></i>
        </button>
        <button type="button" className="btn btn-telegram" title="Telegram" onClick={() => onSocialClick('telegram')}>
          <i className="fab fa-telegram-plane"></i>
        </button>
        <button type="button" className="btn btn-viber" title="Viber" onClick={() => onSocialClick('viber')}>
          <i className="fab fa-viber"></i>
        </button>
        <button type="button" className="btn btn-dribbble" title="Dribbble" onClick={() => onSocialClick('dribbble')}>
          <i className="fab fa-dribbble"></i>
        </button>
      </div>

      <button 
        className="scroll-button right" 
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default SocialButtons; 