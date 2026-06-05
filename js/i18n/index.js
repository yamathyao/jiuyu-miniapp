const { LOCALES } = require("./locales");

const DEFAULT_LOCALE = "zh-CN";

function isSupportedLocale(locale) {
  return Boolean(LOCALES[locale]);
}

function normalizeLocale(locale) {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

function readPath(target, path) {
  return path.split(".").reduce(function (current, key) {
    return current && current[key];
  }, target);
}

function interpolate(template, params) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
  });
}

function createTranslator(locale) {
  const safeLocale = normalizeLocale(locale);
  const dictionary = LOCALES[safeLocale];

  return function t(key, params) {
    const template = readPath(dictionary, key);

    if (typeof template !== "string") {
      return key;
    }

    return interpolate(template, params);
  };
}

module.exports = {
  DEFAULT_LOCALE,
  isSupportedLocale,
  normalizeLocale,
  createTranslator
};
