const url = "https://www.pimak.com/m003r-radyanli-pilic-cevirme-makinesi";
const html = await (await fetch(url)).text();
const section = html.match(/class="tenikdetay"[\s\S]*?(?=class="footer|<footer)/i)?.[0] || "";
const table = section.match(/<table[\s\S]*?<\/table>/i)?.[0];
console.log(table?.slice(0, 2000));
