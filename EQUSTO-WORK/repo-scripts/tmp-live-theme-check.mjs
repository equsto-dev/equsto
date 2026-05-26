const t = await fetch('https://equsto.com/theme.js?t=' + Date.now()).then((r) => r.text());
console.log('skip dept-plp', t.includes('!b.classList.contains("eq-dept-plp")'));
console.log('eq-dept-plp mentions', (t.match(/eq-dept-plp/g) || []).length);
