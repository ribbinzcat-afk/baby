import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../script.js";

const extensionName = "BabyFontManager";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const storageKey = "BabyCustomFonts";

// --- ส่วนที่ 1: ระบบจัดการฟอนต์ (สมองกล) ---

// โหลดฟอนต์ที่เคยเก็บไว้ในความทรงจำ
let savedFonts = JSON.parse(localStorage.getItem(storageKey) || "[]");
let currentFont = localStorage.getItem(storageKey + "_Active");

// ฟังก์ชันฉีดวัคซีน... เอ้ย! ฉีดฟอนต์เข้าสู่ระบบ
function injectFont(name, dataUrl) {
    // เช็คก่อนว่ามีฟอนต์นี้หรือยัง จะได้ไม่ฉีดซ้ำ
    const styleId = `font-style-${name.replace(/\s+/g, '-')}`;
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @font-face {
                font-family: '${name}';
                src: url('${dataUrl}');
            }
        `;
        document.head.appendChild(style);
    }
}

// ฟังก์ชันเปลี่ยนฟอนต์ให้ทั้งหน้าเว็บสวยวิ้ง
function applyFont(name) {
    if (!name) return;

    // สร้าง Style Override เพื่อบังคับใช้ฟอนต์กับทุกส่วนที่ดื้อดึง
    let styleTag = document.getElementById('baby-font-global-override');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'baby-font-global-override';
        document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
        body, textarea, input, .mes_text, .name_text, #chat_header, .drawer-content {
            font-family: '${name}', sans-serif !important;
        }
    `;

    localStorage.setItem(storageKey + "_Active", name);
    toastr.success(`เปลี่ยนโลกเป็นฟอนต์ ${name} เรียบร้อยครับ!`, "Baby Font Manager");
}

// ฟังก์ชันลบฟอนต์ (เผื่อเบื่อแล้ว)
window.deleteBabyFont = (index) => {
    if (!confirm("จะลบน้องฟอนต์คนนี้จริงๆ เหรอครับ? 🥺")) return;

    savedFonts.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(savedFonts));
    updateFontList(); // รีเฟรชรายการใหม่
    toastr.info("ลบฟอนต์เรียบร้อยครับ", "Baby Font Manager");
};

// ฟังก์ชันเลือกใช้ฟอนต์ (สำหรับปุ่มในรายการ)
window.applyBabyFont = applyFont;

// --- ส่วนที่ 2: หน้าตา UI (ความสวยงาม) ---

// ฟังก์ชันอัปเดตรายการฟอนต์ในหน้าต่าง
function updateFontList() {
    const list = $('#baby-font-list');
    list.empty();

    if (savedFonts.length === 0) {
        list.append('<div style="text-align:center; color:#888; padding:20px;">ยังไม่มีฟอนต์เลยครับ เหงาจัง... 🍃</div>');
        return;
    }

    savedFonts.forEach((font, index) => {
        // แอบฉีดฟอนต์เพื่อให้แสดงผลตัวอย่างได้
        injectFont(font.name, font.data);

        const item = $(`
            <div class="font-list-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); margin-bottom:5px; padding:8px; border-radius:5px;">
                <span class="font-preview" style="font-family:'${font.name}'; font-size:1.1em; color:#ffb7b2;">${font.name}</span>
                <div style="display:flex; gap:5px;">
                    <button class="menu_button" style="padding:5px 10px;" onclick="window.applyBabyFont('${font.name}')">✅ ใช้</button>
                    <button class="menu_button menu_button_icon" style="color:#ff6b6b;" onclick="window.deleteBabyFont(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `);
        list.append(item);
    });
}

// สร้างหน้าต่าง Modal (ห้องแต่งตัว)
function createModal() {
    if ($('#baby-font-manager-modal').length) return;

    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width: 450px; max-height: 80vh; overflow-y: auto; background:var(--SmartTheme-bg-color, #202020); border:2px solid #ff99b5; border-radius:10px; padding:20px; box-shadow:0 0 20px rgba(255, 153, 181, 0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="color:#ff99b5; margin:0;">🎀 คลังฟอนต์ของคุณเบบี้</h3>
                <div id="baby-close-btn" style="cursor:pointer; font-size:1.5em; color:#888;">&times;</div>
            </div>

            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-bottom:20px;">
                <label style="display:block; margin-bottom:5px; color:#ddd;">เพิ่มฟอนต์ใหม่ (.ttf / .otf)</label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf,.woff,.woff2" style="width:100%; margin-bottom:10px;">
                <input type="text" id="baby-font-name" class="text_pole" placeholder="ตั้งชื่อฟอนต์น่ารักๆ..." style="width:100%; margin-bottom:10px;">
                <button id="baby-save-btn" class="menu_button" style="width:100%; background:linear-gradient(45deg, #ff99b5, #ffb7b2); color:#222; font-weight:bold;">✨ บันทึกเข้าคลัง ✨</button>
            </div>

            <div id="baby-font-list" style="max-height:300px; overflow-y:auto;">
                <!-- รายชื่อฟอนต์จะโผล่ตรงนี้ -->
            </div>
        </div>
        <div id="baby-modal-backdrop" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9998;"></div>
    `;
    $('body').append(modalHtml);

    // Event Listeners สำหรับใน Modal
    $('#baby-close-btn, #baby-modal-backdrop').on('click', () => {
        $('#baby-font-manager-modal, #baby-modal-backdrop').fadeOut(200);
    });

    $('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = $('#baby-font-name').val();

        if (fileInput.files.length === 0) {
            toastr.warning("เลือกไฟล์ฟอนต์ก่อนสิครับคนสวย!", "เตือนแล้วนะ");
            return;
        }
        if (!nameInput) {
            toastr.warning("ตั้งชื่อให้น้องฟอนต์หน่อยครับ!", "เตือนแล้วนะ");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            savedFonts.push({ name: nameInput, data: fontData });
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));

            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("บันทึกเรียบร้อย! พร้อมใช้งานแล้วครับ", "สำเร็จ");

            // เคลียร์ค่า
            fileInput.value = '';
            $('#baby-font-name').val('');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });
}

// --- ส่วนที่ 3: เริ่มต้นทำงาน (Initialization) ---

jQuery(async () => {
    // 1. โหลด CSS เสริมสวย (ถ้ามีไฟล์ style.css)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${extensionFolderPath}style.css`;
    document.head.appendChild(link);

    // 2. สร้างหน้าต่างเตรียมไว้
    createModal();

    // 3. สร้างปุ่มกดเปิดเมนู (วางไว้ตรงแถบเครื่องมือด้านบน)
    const openBtn = $(`<div class="menu_button fa-solid fa-font" title="จัดการฟอนต์คุณเบบี้" style="order:100;"></div>`);

    // ลองหาที่วาง (ปกติคือ #extensions_menu หรือ .nav-buttons)
    let targetContainer = $('#extensions_menu');
    if (targetContainer.length === 0) targetContainer = $('.nav-buttons').first();

    targetContainer.append(openBtn);

    openBtn.on('click', () => {
        updateFontList();
        $('#baby-font-manager-modal, #baby-modal-backdrop').fadeIn(200);
    });

    // 4. โหลดฟอนต์เดิมกลับมาใช้ (ถ้าเคยเลือกไว้)
    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    console.log(`${extensionName} loaded successfully! 🎀`);
});