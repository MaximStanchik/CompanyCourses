import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const SelectListGroup = ({ name, value, error, info, onChange, options }) => {
  const selectOptions = options.map(option => (
    <option key={option.label} value={option.value}>
      {option.label}
    </option>
  ));
  const isDark = typeof document !== 'undefined' && (document.body.getAttribute('data-theme') === 'dark' || localStorage.getItem('theme') === 'dark');
  const selectStyle = isDark
    ? { background: '#2d2d2d', color: '#fff', border: '1px solid #404040' }
    : { background: '#fff', color: '#222' };
  const infoStyle = isDark ? { color: '#eaf4fd' } : {};
  return (
    <div className="form-group">
      <select
        className={classnames('form-control form-control-lg', {
          'is-invalid': error
        })}
        name={name}
        value={value}
        onChange={onChange}
        style={selectStyle}
      >
        {selectOptions}
      </select>
      {info && <small className="form-text" style={infoStyle}>{info}</small>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

SelectListGroup.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  info: PropTypes.string,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired
};

export default SelectListGroup;
