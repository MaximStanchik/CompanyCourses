import React, { Component } from "react";
import NavBar from "../components/NavBar";
import i18n from "../i18n";

// Временное примечание: Поскольку у нас есть проблемы с I18nextProvider и хуками, переводы могут не работать. После решения проблемы с React и react-i18next, убедитесь, что i18n правильно инициализирован.
class PageNotFound extends Component {
  render() {
    const t = i18n.t.bind(i18n);
    return (
      <div>
        {/* Navigation bar */}
        <NavBar />

        {/*====================  404 page content ====================*/}
        <div>
          <div className="error-page-wrapper d-flex align-items-center">
            <div className="container">
              <div className="row">
                <div className="col-lg-6 col-md-9 m-auto text-center">
                  <div className="error-content-centered d-flex align-items-center justfy-content-center">
                    <div className="error-page-content-wrap">
                      <h2>404</h2>
                      <h3>{t('error.page_not_found')}</h3>
                      <p>{t('error.description')}</p>
                      <a
                        href="/"
                        className="ht-btn ht-btn--default ht-btn--default--dark-hover"
                      >
                        {t('error.back_to_home')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*====================  End of 404 page content  ====================*/}
      </div>
    );
  }
}

export default PageNotFound;
