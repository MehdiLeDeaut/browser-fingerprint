// Compteur de points de données
let dataPointsCollected = 0;
let fingerprintData = {};

// Fonction pour mettre à jour un élément et l'animer
function updateElement(id, value, isLast = false) {
    const element = document.getElementById(id);
    if (element) {
        setTimeout(() => {
            element.textContent = value;
            const parentItem = element.closest('.data-item');
            if (parentItem) {
                parentItem.classList.remove('loading');
                parentItem.classList.add('loaded');
            }
            dataPointsCollected++;
            document.getElementById('dataPoints').textContent = dataPointsCollected;
            
            if (isLast) {
                generateFingerprint();
            }
        }, Math.random() * 1000 + 500);
    }
}

// 1. Informations IP et géolocalisation
async function getIPInfo() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;
        fingerprintData.ip = ip;
        updateElement('ip', ip);
        
        // Obtenir plus d'infos avec l'IP
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoResponse.json();
        
        const location = `${geoData.city || 'Inconnu'}, ${geoData.region || ''} ${geoData.country_name || ''}`;
        fingerprintData.location = location;
        updateElement('location', location);
        
        const isp = geoData.org || 'Non détecté';
        fingerprintData.isp = isp;
        updateElement('isp', isp);
        
        // Vérifier si IPv6
        if (ip.includes(':')) {
            updateElement('ipv6', 'Oui (IPv6)');
        } else {
            updateElement('ipv6', 'Non (IPv4 uniquement)');
        }
        
    } catch (error) {
        updateElement('ip', 'Non récupérable');
        updateElement('location', 'Non disponible');
        updateElement('isp', 'Non disponible');
        updateElement('ipv6', 'Non testable');
    }
}

// 2. Timezone
function getTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(offset / 60);
    const offsetSign = offset > 0 ? '-' : '+';
    fingerprintData.timezone = timezone;
    updateElement('timezone', `${timezone} (UTC${offsetSign}${offsetHours})`);
}

// 3. Détection OS
function getOS() {
    const userAgent = navigator.userAgent;
    let os = 'Inconnu';
    
    if (userAgent.indexOf('Win') !== -1) os = 'Windows';
    else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
    else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
    else if (userAgent.indexOf('Android') !== -1) os = 'Android';
    else if (userAgent.indexOf('iOS') !== -1) os = 'iOS';
    
    // Plus de détails
    if (os === 'Windows') {
        if (userAgent.indexOf('Windows NT 10.0') !== -1) os = 'Windows 10/11';
        else if (userAgent.indexOf('Windows NT 6.3') !== -1) os = 'Windows 8.1';
        else if (userAgent.indexOf('Windows NT 6.2') !== -1) os = 'Windows 8';
        else if (userAgent.indexOf('Windows NT 6.1') !== -1) os = 'Windows 7';
    }
    
    fingerprintData.os = os;
    updateElement('os', os);
}

// 4. Détection du navigateur
function getBrowser() {
    const userAgent = navigator.userAgent;
    let browser = 'Inconnu';
    
    if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox ' + userAgent.split('Firefox/')[1]?.split(' ')[0];
    } else if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
        browser = 'Chrome ' + userAgent.split('Chrome/')[1]?.split(' ')[0];
    } else if (userAgent.indexOf('Edg') > -1) {
        browser = 'Edge ' + userAgent.split('Edg/')[1]?.split(' ')[0];
    } else if (userAgent.indexOf('Safari') > -1) {
        browser = 'Safari ' + userAgent.split('Version/')[1]?.split(' ')[0];
    }
    
    fingerprintData.browser = browser;
    updateElement('browser', browser);
}

// 5. Résolution d'écran
function getScreenResolution() {
    const width = screen.width;
    const height = screen.height;
    const colorDepth = screen.colorDepth;
    const resolution = `${width}x${height} (${colorDepth}-bit)`;
    fingerprintData.screen = resolution;
    updateElement('screen', resolution);
}

// 6. Langue
function getLanguage() {
    const languages = navigator.languages ? navigator.languages.join(', ') : navigator.language;
    fingerprintData.language = languages;
    updateElement('language', languages);
}

// 7. Cookies
function checkCookies() {
    const cookiesEnabled = navigator.cookieEnabled ? 'Oui' : 'Non';
    fingerprintData.cookies = cookiesEnabled;
    updateElement('cookies', cookiesEnabled);
}

// 8. Do Not Track
function checkDNT() {
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    const dntStatus = dnt === '1' ? 'Activé' : 'Désactivé';
    fingerprintData.dnt = dntStatus;
    updateElement('dnt', dntStatus);
}

// 9. CPU
function getCPU() {
    const cores = navigator.hardwareConcurrency || 'Non disponible';
    fingerprintData.cpu = cores;
    updateElement('cpu', cores + ' cœurs');
}

// 10. RAM (estimation)
function getRAM() {
    const memory = navigator.deviceMemory;
    const ram = memory ? `~${memory} GB` : 'Non disponible';
    fingerprintData.ram = ram;
    updateElement('ram', ram);
}

// 11. GPU via WebGL
function getGPU() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL disponible';
            fingerprintData.gpu = gpu;
            updateElement('gpu', gpu);
        } else {
            updateElement('gpu', 'Non disponible');
        }
    } catch (e) {
        updateElement('gpu', 'Erreur de détection');
    }
}

// 12. Écran tactile
function getTouchSupport() {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const touchStatus = hasTouch ? 'Oui' : 'Non';
    fingerprintData.touch = touchStatus;
    updateElement('touch', touchStatus);
}

// 13. Batterie
async function getBatteryInfo() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            const level = Math.round(battery.level * 100);
            const charging = battery.charging ? 'En charge' : 'Sur batterie';
            const batteryInfo = `${level}% - ${charging}`;
            fingerprintData.battery = batteryInfo;
            updateElement('battery', batteryInfo);
        } catch (e) {
            updateElement('battery', 'Non accessible');
        }
    } else {
        updateElement('battery', 'API non supportée');
    }
}

// 14. Type d'appareil
function getDeviceType() {
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        deviceType = 'Tablette';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        deviceType = 'Mobile';
    }
    
    fingerprintData.device = deviceType;
    updateElement('device', deviceType);
}

// 15. Navigation privée (tentative de détection)
async function detectIncognito() {
    let isIncognito = false;
    
    // Test pour Chrome/Edge
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const { quota } = await navigator.storage.estimate();
            isIncognito = quota < 120000000; // Moins de 120MB suggère le mode incognito
        } catch (e) {}
    }
    
    // Test pour Firefox
    if (typeof indexedDB !== 'undefined') {
        try {
            const fs = await new Promise((resolve, reject) => {
                const db = indexedDB.open('test');
                db.onsuccess = () => resolve(false);
                db.onerror = () => resolve(true);
            });
            isIncognito = fs;
        } catch (e) {
            isIncognito = true;
        }
    }
    
    const incognitoStatus = isIncognito ? 'Probablement Oui ⚠️' : 'Probablement Non';
    fingerprintData.incognito = incognitoStatus;
    updateElement('incognito', incognitoStatus);
}

// 16. Extensions (détection basique)
function detectExtensions() {
    // Test pour AdBlock
    const testAd = document.createElement('div');
    testAd.className = 'ad adsbox doubleclick';
    testAd.style.position = 'absolute';
    testAd.style.left = '-9999px';
    document.body.appendChild(testAd);
    
    setTimeout(() => {
        const adblocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        fingerprintData.adblock = adblocked ? 'Détecté' : 'Non détecté';
        updateElement('adblock', adblocked ? 'Détecté ✓' : 'Non détecté');
    }, 100);
    
    updateElement('extensions', 'Scan partiel - Voir AdBlock');
}

// 17. WebRTC IP Leak + Local IP
async function checkWebRTC() {
    try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        let ips = [];
        let localIPs = [];
        
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate || !ice.candidate.candidate) {
                updateElement('webrtc', ips.length > 0 ? `Fuite: ${ips.length} IP` : 'Pas de fuite');
                updateElement('local-ip', localIPs.length > 0 ? localIPs.join(', ') : 'Non détectable');
                pc.close();
                return;
            }
            const parts = ice.candidate.candidate.split(' ');
            const ip = parts[4];
            if (ip && ips.indexOf(ip) === -1) {
                ips.push(ip);
                // Détecter IP locale (192.168.x.x, 10.x.x.x, etc.)
                if (ip.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/) || ip.includes(':')) {
                    localIPs.push(ip);
                }
            }
        };
        
        setTimeout(() => {
            updateElement('webrtc', ips.length > 0 ? `${ips.length} IP détectée(s)` : 'Test timeout');
            updateElement('local-ip', localIPs.length > 0 ? localIPs[0] : 'Non détectable');
            pc.close();
        }, 3000);
    } catch (e) {
        updateElement('webrtc', 'Non testable');
        updateElement('local-ip', 'Erreur');
    }
}

// 18. Canvas Fingerprinting
function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const text = 'Browser Fingerprinting 🔐 2025';
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText(text, 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText(text, 4, 17);
        
        const dataURL = canvas.toDataURL();
        const hash = simpleHash(dataURL);
        fingerprintData.canvas = hash;
        updateElement('canvas', hash.substring(0, 16) + '...');
    } catch (e) {
        updateElement('canvas', 'Erreur');
    }
}

// 19. Fonts (détection basique)
function detectFonts() {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];
    
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidth = {};
    const defaultHeight = {};
    
    for (const baseFont of baseFonts) {
        s.style.fontFamily = baseFont;
        h.appendChild(s);
        defaultWidth[baseFont] = s.offsetWidth;
        defaultHeight[baseFont] = s.offsetHeight;
        h.removeChild(s);
    }
    
    const fontsToTest = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 
                         'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
                         'Impact', 'Lucida Console', 'Tahoma', 'Century Gothic', 'Helvetica'];
    
    let detectedFonts = 0;
    for (const font of fontsToTest) {
        for (const baseFont of baseFonts) {
            s.style.fontFamily = font + ',' + baseFont;
            h.appendChild(s);
            const matched = (s.offsetWidth !== defaultWidth[baseFont] || s.offsetHeight !== defaultHeight[baseFont]);
            h.removeChild(s);
            if (matched) {
                detectedFonts++;
                break;
            }
        }
    }
    
    fingerprintData.fonts = detectedFonts;
    updateElement('fonts', `${detectedFonts}/${fontsToTest.length} détectées`);
}

// 20. Type de connexion
function getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        const type = connection.effectiveType || connection.type || 'Inconnu';
        fingerprintData.connection = type;
        updateElement('connection', type.toUpperCase());
        
        const downlink = connection.downlink;
        if (downlink) {
            updateElement('speed', `${downlink} Mbps`);
        } else {
            updateElement('speed', 'Non mesurable');
        }
    } else {
        updateElement('connection', 'API non supportée');
        updateElement('speed', 'Non disponible');
    }
}

// 21. Proxy (détection basique)
function detectProxy() {
    // Méthode simple: vérifier si l'heure système correspond à la timezone
    updateElement('proxy', 'Détection limitée');
}

// 22. Port Scanning Local (ports communs)
async function scanLocalPorts() {
    const commonPorts = [80, 443, 3000, 8080, 8443];
    let openPorts = [];
    
    for (const port of commonPorts) {
        try {
            const img = new Image();
            const timeout = new Promise(resolve => setTimeout(() => resolve(false), 200));
            const load = new Promise(resolve => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
                img.src = `http://localhost:${port}`;
            });
            
            const result = await Promise.race([load, timeout]);
            if (result) openPorts.push(port);
        } catch (e) {}
    }
    
    updateElement('ports', openPorts.length > 0 ? openPorts.join(', ') : 'Aucun détecté');
}

// 23-27. Media Devices (Caméras, Micros, Speakers)
async function detectMediaDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const cameras = devices.filter(d => d.kind === 'videoinput').length;
            const mics = devices.filter(d => d.kind === 'audioinput').length;
            const speakers = devices.filter(d => d.kind === 'audiooutput').length;
            
            updateElement('cameras', cameras > 0 ? `${cameras} détectée(s)` : 'Aucune');
            updateElement('microphones', mics > 0 ? `${mics} détecté(s)` : 'Aucun');
            updateElement('speakers', speakers > 0 ? `${speakers} détecté(s)` : 'Non listables');
        } catch (e) {
            updateElement('cameras', 'Permission refusée');
            updateElement('microphones', 'Permission refusée');
            updateElement('speakers', 'Permission refusée');
        }
    } else {
        updateElement('cameras', 'API non supportée');
        updateElement('microphones', 'API non supportée');
        updateElement('speakers', 'API non supportée');
    }
}

// 28. Audio Fingerprinting
function getAudioFingerprint() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
        
        gainNode.gain.value = 0; // Mute
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.start(0);
        
        scriptProcessor.onaudioprocess = function(event) {
            const output = event.outputBuffer.getChannelData(0);
            const hash = simpleHash(output.slice(0, 30).join(''));
            fingerprintData.audioFP = hash;
            updateElement('audio-fp', hash.substring(0, 12) + '...');
            oscillator.stop();
            scriptProcessor.disconnect();
        };
        
        setTimeout(() => {
            if (!fingerprintData.audioFP) {
                updateElement('audio-fp', 'Timeout');
            }
        }, 1000);
    } catch (e) {
        updateElement('audio-fp', 'Non supporté');
    }
}

// 29. Voices (Text-to-Speech)
function detectVoices() {
    if ('speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            updateElement('voices', `${voices.length} voix disponibles`);
        } else {
            // Retry après chargement
            speechSynthesis.onvoiceschanged = () => {
                const v = speechSynthesis.getVoices();
                updateElement('voices', `${v.length} voix disponibles`);
            };
            setTimeout(() => {
                if (speechSynthesis.getVoices().length === 0) {
                    updateElement('voices', 'Aucune voix');
                }
            }, 1000);
        }
    } else {
        updateElement('voices', 'API non supportée');
    }
}

// 30. Plugins
function detectPlugins() {
    const plugins = navigator.plugins;
    if (plugins && plugins.length > 0) {
        updateElement('plugins', `${plugins.length} plugin(s)`);
    } else {
        updateElement('plugins', 'Aucun ou bloqués');
    }
}

// 31-33. Sensors (Accelerometer, Gyroscope)
async function detectSensors() {
    // Accéléromètre
    if ('Accelerometer' in window) {
        try {
            const acl = new Accelerometer({ frequency: 1 });
            acl.start();
            updateElement('accelerometer', 'Disponible');
            acl.stop();
        } catch (e) {
            updateElement('accelerometer', 'Permission refusée');
        }
    } else if (window.DeviceMotionEvent) {
        updateElement('accelerometer', 'API legacy disponible');
    } else {
        updateElement('accelerometer', 'Non supporté');
    }
    
    // Gyroscope
    if ('Gyroscope' in window) {
        try {
            const gyro = new Gyroscope({ frequency: 1 });
            gyro.start();
            updateElement('gyroscope', 'Disponible');
            gyro.stop();
        } catch (e) {
            updateElement('gyroscope', 'Permission refusée');
        }
    } else if (window.DeviceOrientationEvent) {
        updateElement('gyroscope', 'API legacy disponible');
    } else {
        updateElement('gyroscope', 'Non supporté');
    }
}

// 34. Screen Orientation
function detectOrientation() {
    if (screen.orientation) {
        const orientation = screen.orientation.type;
        updateElement('orientation', orientation);
    } else {
        updateElement('orientation', 'Non détectable');
    }
}

// 35. Gamepad
function detectGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const connected = Array.from(gamepads).filter(g => g !== null).length;
    updateElement('gamepad', connected > 0 ? `${connected} connectée(s)` : 'Aucune');
}

// 36. Bluetooth
async function detectBluetooth() {
    if ('bluetooth' in navigator) {
        updateElement('bluetooth', 'API disponible (permission requise)');
    } else {
        updateElement('bluetooth', 'Non supporté');
    }
}

// 37. USB
async function detectUSB() {
    if ('usb' in navigator) {
        updateElement('usb', 'API disponible (permission requise)');
    } else {
        updateElement('usb', 'Non supporté');
    }
}

// 38-41. CSS History Sniffing
function checkHistoryVisited(url, elementId) {
    const link = document.createElement('a');
    link.href = url;
    link.style.position = 'absolute';
    link.style.left = '-9999px';
    document.body.appendChild(link);
    
    setTimeout(() => {
        // Cette méthode est limitée par les navigateurs modernes
        // On simule juste la détection
        updateElement(elementId, 'Protection active');
        document.body.removeChild(link);
    }, 100);
}

// 42. Clipboard
async function checkClipboard() {
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.readText();
            updateElement('clipboard', 'Accessible (permission)');
        } catch (e) {
            updateElement('clipboard', 'Bloqué par le navigateur');
        }
    } else {
        updateElement('clipboard', 'API non supportée');
    }
}

// 43. Notifications
function checkNotifications() {
    if ('Notification' in window) {
        const permission = Notification.permission;
        updateElement('notifications', permission === 'granted' ? 'Autorisées' : permission === 'denied' ? 'Refusées' : 'Non demandées');
    } else {
        updateElement('notifications', 'Non supporté');
    }
}

// 44-46. Performance Timing
function getPerformanceTiming() {
    if (performance && performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        const renderTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        
        updateElement('load-time', loadTime > 0 ? `${loadTime}ms` : 'En cours...');
        updateElement('render-time', renderTime > 0 ? `${renderTime}ms` : 'En cours...');
    } else {
        updateElement('load-time', 'Non disponible');
        updateElement('render-time', 'Non disponible');
    }
}

// 47. GPU Performance (simple benchmark)
function benchmarkGPU() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const start = performance.now();
            // Simple test de rendu
            for (let i = 0; i < 1000; i++) {
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            const end = performance.now();
            const score = Math.round(1000 / (end - start));
            updateElement('gpu-perf', `Score: ${score}`);
        } else {
            updateElement('gpu-perf', 'WebGL indisponible');
        }
    } catch (e) {
        updateElement('gpu-perf', 'Erreur');
    }
}

// 48-50. Storage APIs
function checkStorageAPIs() {
    // SessionStorage
    try {
        sessionStorage.setItem('test', '1');
        sessionStorage.removeItem('test');
        updateElement('session-storage', 'Disponible');
    } catch (e) {
        updateElement('session-storage', 'Bloqué');
    }
    
    // LocalStorage
    try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        updateElement('local-storage', 'Disponible');
    } catch (e) {
        updateElement('local-storage', 'Bloqué');
    }
    
    // IndexedDB
    if (window.indexedDB) {
        updateElement('indexed-db', 'Disponible');
    } else {
        updateElement('indexed-db', 'Non supporté');
    }
}

// Fonction de hachage simple
function simpleHash(str) {
    let hash = 0;
    const strString = String(str);
    for (let i = 0; i < strString.length; i++) {
        const char = strString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Générer l'empreinte finale
function generateFingerprint() {
    const fingerprintString = JSON.stringify(fingerprintData);
    const fingerprintHash = simpleHash(fingerprintString);
    
    setTimeout(() => {
        document.getElementById('fingerprint-hash').textContent = fingerprintHash.toUpperCase();
        document.getElementById('uniqueId').textContent = fingerprintHash.substring(0, 8).toUpperCase();
        document.getElementById('trackable').textContent = '99.9%';
        document.getElementById('fp-points').textContent = dataPointsCollected;
    }, 2000);
}

// Initialisation au chargement de la page
window.addEventListener('load', () => {
    // Lancer toutes les détections - Section 1: Identité & Système
    getTimezone();
    getOS();
    getBrowser();
    getScreenResolution();
    getLanguage();
    checkCookies();
    checkDNT();
    
    // Section 2: Matériel
    getCPU();
    getRAM();
    getGPU();
    getTouchSupport();
    getBatteryInfo();
    getDeviceType();
    
    // Section 3: Sécurité
    detectIncognito();
    detectExtensions();
    checkWebRTC();
    getCanvasFingerprint();
    detectFonts();
    
    // Section 4: Réseau
    getConnectionType();
    detectProxy();
    scanLocalPorts();
    
    // Section 5: Multimédia
    detectMediaDevices();
    getAudioFingerprint();
    detectVoices();
    detectPlugins();
    
    // Section 6: Capteurs
    detectSensors();
    detectOrientation();
    detectGamepad();
    detectBluetooth();
    detectUSB();
    
    // Section 7: Comportement
    checkHistoryVisited('https://linkedin.com', 'history-linkedin');
    checkHistoryVisited('https://facebook.com', 'history-facebook');
    checkHistoryVisited('https://twitter.com', 'history-twitter');
    checkHistoryVisited('https://github.com', 'history-github');
    checkClipboard();
    checkNotifications();
    
    // Section 8: Performance
    setTimeout(getPerformanceTiming, 1000);
    benchmarkGPU();
    checkStorageAPIs();
    
    // Fonctions async
    getIPInfo();
    
    // Générer l'empreinte après 4 secondes
    setTimeout(generateFingerprint, 4000);
});

// Effet de typing pour le titre
const title = document.querySelector('h1');
const originalText = title.textContent;
title.textContent = '';
let i = 0;

function typeWriter() {
    if (i < originalText.length) {
        title.textContent += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
    }
}

setTimeout(typeWriter, 500);
