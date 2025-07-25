import React from 'react';
import i18n from '../../i18n';

export default () => {
  const t = i18n.t.bind(i18n);
  return (
    <div>
      <h1 className="display-4">{t('error.page_not_found')}</h1>
      <p>{t('error.description')}</p>
    </div>
  );
};
