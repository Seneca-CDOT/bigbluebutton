import { Meteor } from 'meteor/meteor';
import Langmap from 'langmap';
import Users from '/imports/api/users';
import fs from 'fs';
import Logger from './logger';
import Redis from './redis';

const AVAILABLE_LOCALES = fs.readdirSync('assets/app/locales');

Meteor.startup(() => {
  const APP_CONFIG = Meteor.settings.public.app;
  const env = Meteor.isDevelopment ? 'development' : 'production';
  Logger.warn(`SERVER STARTED. ENV=${env}, nodejs version=${process.version}`, APP_CONFIG);
});

WebApp.connectHandlers.use('/check', (req, res) => {
  const payload = { html5clientStatus: 'running' };

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify(payload));
});

WebApp.connectHandlers.use('/locale', (req, res) => {
  const APP_CONFIG = Meteor.settings.public.app;
  const fallback = APP_CONFIG.defaultSettings.application.fallbackLocale;
  const browserLocale = req.query.locale.split(/[-_]/g);
  const localeList = [fallback];

  const usableLocales = AVAILABLE_LOCALES
    .map(file => file.replace('.json', ''))
    .reduce((locales, locale) =>
      (locale.match(browserLocale[0]) ? [...locales, locale] : locales), []);

  const regionDefault = usableLocales.find(locale => browserLocale[0] === locale);

  if (regionDefault) localeList.push(regionDefault);
  if (!regionDefault && usableLocales.length) localeList.push(usableLocales[0]);

  let normalizedLocale;
  let messages = {};

  if (browserLocale.length > 1) {
    normalizedLocale = `${browserLocale[0]}_${browserLocale[1].toUpperCase()}`;
    localeList.push(normalizedLocale);
  }

  localeList.forEach((locale) => {
    try {
      const data = Assets.getText(`locales/${locale}.json`);
      messages = Object.assign(messages, JSON.parse(data));
      normalizedLocale = locale;
    } catch (e) {
      // Getting here means the locale is not available on the files.
    }
  });

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ normalizedLocale, messages }));
});

WebApp.connectHandlers.use('/locales', (req, res) => {
  let locales = [];
  try {
    locales = AVAILABLE_LOCALES
      .map(file => file.replace('.json', ''))
      .map(file => file.replace('_', '-'))
      .map(locale => ({
        locale,
        name: Langmap[locale].nativeName,
      }));
  } catch (e) {
    // Getting here means the locale is not available on the files.
  }

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify(locales));
});

WebApp.connectHandlers.use('/feedback', (req, res) => {
  req.on('data', Meteor.bindEnvironment((data) => {
    const body = JSON.parse(data);
    const {
      meetingId,
      userId,
      authToken,
    } = body;

    const user = Users.findOne({
      meetingId,
      userId,
      connectionStatus: 'offline',
      authToken,
    });

    const feedback = {
      userName: user.name,
      ...body,
    };
    Logger.info('FEEDBACK LOG:', feedback);
  }));

  req.on('end', Meteor.bindEnvironment(() => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  }));
});


export const eventEmitter = Redis.emitter;

export const redisPubSub = Redis;
