let symbols;
let inavIndex;
let isFixed;
let $inavValue;
const inavListUrl = 'https://iss.moex.com/iss/engines/stock/markets/index/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,BOARDID,CURRENCYID';
const url = _ => inavIndex && 'https://iss.moex.com/iss/engines/stock/markets/index/securities/' + inavIndex + '.json?iss.meta=off&iss.only=marketdata&marketdata.columns=CURRENTVALUE';
const delay = 250;

const delayFetch = (url, options) =>
    new Promise(resolve => {
        setTimeout(_ => {
            resolve(fetch(url));
        }, options.delay);
    });

const inavUpdate = value => {
    $inavValue.dataset.symbol = inavIndex || 'iNAV';
    $inavValue.dataset.value = value || 'Н/Д';
    if (!inavIndex) {
        setTimeout(inavUpdate, delay);
        return;
    }
    delayFetch(url(), {
        delay: delay
    }).then(response => response.json())
        .then(json => {
            inavUpdate(json.marketdata.data[0][0].toFixed(4));
        })
        .catch(e => {
            inavUpdate();
        });
}

const checkSymbol = e => {
    if (e.target.id === 'moex-inav-widget') {
        if (!inavIndex) return;

        isFixed = !isFixed;
        localStorage.setItem('isFixed', +isFixed);
        $inavValue.classList.toggle('is-active', isFixed);
        return;
    }
    if (isFixed) return;
    const notTarget = e.target.closest('[data-qa-tag]');
    if (notTarget && (notTarget.dataset.qaTag === 'icon' || notTarget.dataset.qaTag === 'tabTitle')) return;
    const target = e.target.closest('[data-symbol-id]');
    if (!target || !target.dataset.symbolId) return;
    const symbol = symbols.find(s => s.indexOf(target.dataset.symbolId) === 0);
    if (symbol && symbol !== inavIndex) {
        inavIndex = symbol;
        localStorage.setItem('symbol', inavIndex);
        $inavValue.dataset.value = 'Н/Д';
    }
}

const observer = new MutationObserver((mutations, mutationInstance) => {
    const $insertAfter = document.querySelector('#marquee-search');
    if (!$insertAfter) return;
    $insertAfter.insertAdjacentHTML('beforebegin', '<div id="moex-inav-widget"></div>');
    $inavValue = document.querySelector('#moex-inav-widget');
    inavIndex = localStorage.getItem('symbol');
    isFixed = +localStorage.getItem('isFixed');
    if (isFixed) $inavValue.classList.add('is-active');
    fetch(inavListUrl).then(response => response.json())
        .then(json => {
            symbols = json.securities.data.filter(k => k[1] === 'INAV' && k[2] === 'RUB').map(k => k[0]);
            document.addEventListener('click', checkSymbol, {capture: true});
            inavUpdate();
        });
    mutationInstance.disconnect()
});

observer.observe(document, {
    childList: true,
    subtree: true
});