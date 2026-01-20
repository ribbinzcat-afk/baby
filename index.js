// index.js - ฉบับมีปุ่มกดแล้วจ้า!

import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../script.js";

const extensionName = "BabyFontManager";
const extensionFolderPath = `scripts/extensions/${extensionName}/`;

// โหลด CSS เข้ามาเสริมสวย
function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${extensionFolderPath}style.css`;
    document.head.appendChild(link);
}

// สร้าง HTML ของหน้าต่าง Modal (ห้องแต่งตัว)
function createModal() {
    // เช็คก่อนว่ามี Modal อยู่แล้วหรือยัง จะได้ไม่สร้างซ้ำ
    if (document.getElementById('baby-font-manager-modal')) return;

    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none;">
            <div class="baby-modal-content">
                <div class="baby-modal-header">
                    <h3>🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
                    <span id="close-baby-modal" class="baby-close-btn">&times;</span>
                </div>
                <div class="baby-modal-body">
                    <p>เลือกฟอนต์น่ารักๆ มาใส่ได้เลยค่ะ!</p>
                    <input type="file" id="baby-font-upload" accept=".ttf,.otf,.woff,.woff2">
                    <div id="baby-font-preview" class="font-preview-box">
                        ตัวอย่าง: The quick brown fox jumps over the lazy dog.
                        <br>
                        ตัวอย่าง: คุณเบบี้คนสวยน่ารักที่สุดในโลก!
                    </div>
                    <button id="baby-apply-font" class="baby-btn">✨ ใช้ฟอนต์นี้เลย ✨</button>
                    <button id="baby-reset-font" class="baby-btn-secondary">ล้างค่ากลับเป็นเดิม</button>
                </div>
            </div>
        </div>
    `;

    // แปะ Modal ลงไปใน Body ของเว็บ
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // ผูก Event ให้ปุ่มปิด Modal
    document.getElementById('close-baby-modal').addEventListener('click', () => {
        document.getElementById('baby-font-manager-modal').style.display = 'none';
    });

    // คลิกพื้นที่ว่างๆ นอกกล่องเพื่อปิด
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('baby-font-manager-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- ส่วนสำคัญ! ผูกฟังก์ชันให้ปุ่มต่างๆ ทำงาน ---
    document.getElementById('baby-font-upload').addEventListener('change', handleFontUpload);
    document.getElementById('baby-apply-font').addEventListener('click', applyFontSettings);
    document.getElementById('baby-reset-font').addEventListener('click', resetFontSettings);
}

// --- พระเอกของเรา! ฟังก์ชันสร้างปุ่มกดเปิดเมนู ---
function createMenuButton() {
    // หาที่อยู่ของแถบเมนูข้างบน (Top Bar)
    const topBar = document.querySelector('#quick-reply-container') || document.querySelector('.nav-buttons');

    if (!topBar) {
        console.error("หาที่วางปุ่มไม่เจอครับ! แต่ไม่เป็นไร เดี๋ยวโรโบแปะไว้มุมขวาบนให้ก่อน");
        // ถ้าหาที่วางไม่ได้จริงๆ ให้สร้างปุ่มลอยๆ ไว้มุมจอ
        const floatingBtn = document.createElement('div');
        floatingBtn.id = "baby-font-trigger";
        floatingBtn.innerHTML = "🅰️";
        floatingBtn.className = "menu_button";
        floatingBtn.style.cssText = "position:fixed; top:10px; right:10px; z-index:9998; cursor:pointer; font-size:24px;";
        floatingBtn.title = "เปลี่ยนฟอนต์";
        document.body.appendChild(floatingBtn);

        floatingBtn.addEventListener('click', () => {
            document.getElementById('baby-font-manager-modal').style.display = 'block';
        });
        return;
    }

    // สร้างปุ่ม
    const button = document.createElement('div');
    button.id = "baby-font-trigger";
    button.className = "menu_button fa-solid fa-font"; // ใช้ไอคอน Font Awesome
    button.title = "เปลี่ยนฟอนต์มุ้งมิ้ง";

    // แต่งสีปุ่มให้เด่นๆ หน่อย
    button.style.color = "#ffb7b2"; // สีชมพูอ่อนๆ
    button.style.cursor = "pointer";

    // กดแล้วเปิด Modal
    button.addEventListener('click', () => {
        const modal = document.getElementById('baby-font-manager-modal');
        if(modal) modal.style.display = 'block';
    });

    // แปะปุ่มลงไปในแถบเมนู
    topBar.appendChild(button);
}

// ฟังก์ชันจัดการตอนอัปโหลดไฟล์ (แบบย่อ)
function handleFontUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const fontData = e.target.result;
        // เก็บข้อมูลฟอนต์ไว้ในตัวแปรชั่วคราว หรือ Preview ให้ดู
        document.getElementById('baby-font-preview').style.fontFamily = 'BabyCustomFont';

        // สร้าง FontFace ชั่วคราวเพื่อดูตัวอย่าง
        const newFont = new FontFace('BabyCustomFont', `url(${fontData})`);
        newFont.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
            document.getElementById('baby-font-preview').style.fontFamily = 'BabyCustomFont';
        });

        // เก็บข้อมูลไฟล์ไว้รอการบันทึก (ในที่นี้เราจะเก็บใน localStorage แบบง่ายๆ)
        localStorage.setItem('BabyCustomFontData', fontData);
    };
    reader.readAsDataURL(file);
}

// ฟังก์ชันกดปุ่ม "ใช้เลย"
function applyFontSettings() {
    const fontData = localStorage.getItem('BabyCustomFontData');
    if (!fontData) {
        alert("ยังไม่ได้เลือกฟอนต์เลยครับคุณเบบี้!");
        return;
    }

    // สร้าง Style Tag เพื่อบังคับใช้ฟอนต์กับทั้งหน้าเว็บ
    let styleTag = document.getElementById('baby-font-style-override');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'baby-font-style-override';
        document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
        @font-face {
            font-family: 'BabyMainFont';
            src: url('${fontData}');
        }
        body, textarea, input, .mes_text {
            font-family: 'BabyMainFont', sans-serif !important;
        }
    `;

    alert("เปลี่ยนฟอนต์เรียบร้อย! น่ารักขึ้น 300% ครับ!");
    document.getElementById('baby-font-manager-modal').style.display = 'none';
}

function resetFontSettings() {
    localStorage.removeItem('BabyCustomFontData');
    const styleTag = document.getElementById('baby-font-style-override');
    if (styleTag) styleTag.remove();
    alert("กลับมาใช้ฟอนต์เดิมแล้วครับ");
}

// เริ่มทำงานเมื่อ SillyTavern โหลดเสร็จ
jQuery(async () => {
    loadCSS();
    createModal();
    createMenuButton(); // <--- บรรทัดนี้แหละที่ผมลืม!

    // โหลดฟอนต์เก่าที่เคยตั้งไว้ (ถ้ามี)
    const savedFont = localStorage.getItem('BabyCustomFontData');
    if (savedFont) {
        applyFontSettings();
    }
});