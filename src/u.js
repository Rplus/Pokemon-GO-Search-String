import pms from './data.pm.json';
import cpm from './data.cpm.json';
import langs from './data.lang.json';
import names from './data.name.json';

pms.forEach(pm => {
  pm.uid = pm.dex + (pm.isotope ? `-${pm.isotope}` : '');
  pm.ddex = `00${pm.dex}`.slice(-3);
  pm.name = getPmName(pm.ddex, 'en');
});

export const jsonData = {
  pms,
  langs,
  names,
};

export function getMatchingString(a, t) {
  let list = '';
  let last = -1;
  for ( let i = 0; i < a.length; i++ ) {
    if ( a[i] === last + 1 ) {
      list += '-';
      last = a[i];
      while ( ++i < a.length ) {
        if ( a[i] !== last + 1 ) { break; }
        last = a[i];
      }
      if ( a[--i] < 9999 ) {
        list += a[i];
      }
    } else {
      list += ',' + t + a[i];
      last = a[i];
    }
  }

  return list.substr(1);
};


export function searchString(data) {
  let pm = data.pm;
  if (!pm) { return 'GG'; }

  let cps = new Set();
  let hps = new Set();
  const [cpstr, hpstr] = data.cphp;
  const [baseA, baseD, baseS] = [...pm.ads];

  for ( let atk = data.min_iv_a; atk <= 15; atk++ ) {
    for ( let def = data.min_iv_d; def <= 15; def++ ) {
      for ( let sta = data.min_iv_s; sta <= 15; sta++ ) {
        if ( atk + def + sta < data.min_iv ) { continue; }

        for ( let level = data.min_lv; level <= data.max_lv; level++ ) {
          let cp = Math.floor(
            (baseA + atk)
            * Math.sqrt(baseD + def)
            * Math.sqrt(baseS + sta)
            * (cpm[level] * cpm[level] / 10)
          );
          if (cp < 10) { cp = 10; }
          cps.add(cp);

          let hp = Math.floor((baseS + sta) * cpm[level]);
          if (hp < 10) { hp = 10; }
          hps.add(hp);
        }
      }
    }
  }

  if (data.trash) {
    let max = 0;
    for ( let i = 10; i <= 9999; i++ ) {
      if ( cps.has(i) ) {
        max = i;
      }
    }
    for ( let i = 10; i <= max; i++ ) {
      if ( cps.has(i) ) {
        cps.delete(i);
      } else {
        cps.add(i);
      }
    }
  }

  cps = Array.from(cps);
  cps.sort((a, b) => a - b);

  let output = pm.dex + '&' + getMatchingString(cps, cpstr);

  if (!data.trash) {
    hps = Array.from(hps);
    hps.sort((a, b) => a - b);
    output += '&' + getMatchingString(hps, hpstr);
  }

  return output;
};


export function genOptions(v, l = v) {
  return `<option value="${v}" label="${l}"></option>`;
};


const defaultUrl = {
  uid: '1',
  iads: [44, 14, 13, 13],
  lv: [1, 35],
  lang: 'en',
  trash: true,
};

export function urlCoCoCo(hash) {
  let urlo = [...new URLSearchParams(hash.replace(/^#/, ''))]
    .reduce((all, i) => {
      let v = i[1];
      if (v.indexOf('-') !== -1) {
        v = v.split('-').map(Number);
      }
      all[ i[0] ] = v;
      return all;
    }, {});

  let urlo2 = {
    ...defaultUrl,
    ...urlo
  };

  let [min_iv, min_iv_a, min_iv_d, min_iv_s, min_lv, max_lv] = [...urlo2.iads, ...urlo2.lv];
  let trash = !(urlo2.trash === 'false');

  return {
    uid: urlo2.uid,
    min_iv,
    min_iv_a,
    min_iv_d,
    min_iv_s,
    min_lv,
    max_lv,
    lang: urlo2.lang,
    trash,
  };
};


export function urlGoGoGo(data) {
  return new URLSearchParams({
    uid: data.uid,
    iads: [
      data.min_iv,
      data.min_iv_a,
      data.min_iv_d,
      data.min_iv_s].join('-'),
    lv: [
      data.min_lv,
      data.max_lv].join('-'),
    lang: data.lang,
    trash: data.trash,
  }).toString();
};


export const options = {
  ivp: [...Array(46).keys()]
    .map(i => [i, +(i * 100 / 45).toFixed()]).reverse(),

  iv: [...Array(16).keys()].reverse(),

  lv: [...Array(40).keys()]
    .map(i => i + 1).reverse(),
};

export function getPM(uid) {
  return pms.find(_pm => _pm.uid === uid);
};

export function getPmName(ddex, lang = 'en') {
  return names[ddex][lang] || names[ddex].en;
}


const STORAGE_KEY = 'Search-String';
export function saveItem(data) {
  if (!data || !data.key) { return false;}
  let odata = getItem() || {};

  odata[data.key] = data.value;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(odata));
};

export function getItem(key) {
  let data = localStorage.getItem(STORAGE_KEY);
  if (!data) { return null; }
  data = JSON.parse(data);

  return key ? data[key] : data;
};
