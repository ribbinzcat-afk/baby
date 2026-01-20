jQuery(document).ready(function () {
    const extensionName = "BabyFontManager";
    const storageKey = "BabyCustomFonts";

    // โหลดฟอนต์ที่เคยเก็บไว้
    let savedFonts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let currentFont = localStorage.getItem(storageKey + "_Active");

    // ฟังก์ชันสร้าง CSS @font-face
    function injectFont(name, dataUrl) {
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

    // ฟังก์ชันเปลี่ยนฟอนต์ทั้งหน้าเว็บ
    function applyFont(name) {
        if (!name) return;
        jQuery('body').css('font-family', `'${name}', sans-serif`);
        localStorage.setItem(storageKey + "_Active", name);
        toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วครับ!`, "Baby Font Manager");
    }

    // โหลดฟอนต์ทั้งหมดลงในระบบตอนเริ่ม
    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    // --- ส่วนสร้างหน้าต่าง UI ---

    // ปุ่มเปิดเมนู (จะไปโผล่ที่แถบเครื่องมือด้านบน)
    const openBtn = jQuery(`<div class="fa-solid fa-font" title="จัดการฟอนต์"></div>`);
    jQuery('#extensions_menu').append(openBtn); // หรือตำแหน่งอื่นที่ต้องการ

    // สร้าง HTML ของหน้าต่าง Modal
    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width: 400px; max-height: 80vh; overflow-y: auto;">
            <h3 style="color:#ff99b5; text-align:center;">🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
            <hr style="border-color:#ff99b5;">

            <div style="margin-bottom: 15px;">
                <label>อัปโหลดฟอนต์ใหม่ (.ttf/.otf)</label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf" style="width:100%; margin-top:5px;">
                <input type="text" id="baby-font-name" placeholder="ตั้งชื่อฟอนต์..." style="width:100%; margin-top:5px; background:#333; color:white; border:1px solid #555; padding:5px;">
                <button id="baby-save-btn" class="baby-btn" style="width:100%; margin-top:10px;">บันทึกฟอนต์ ✨</button>
            </div>

            <div id="baby-font-list">
                <!-- รายชื่อฟอนต์จะโผล่ตรงนี้ -->
            </div>

            <button id="baby-close-btn" class="baby-btn" style="background:#555; color:white; width:100%; margin-top:10px;">ปิดหน้าต่าง</button>
        </div>
    `;
    jQuery('body').append(modalHtml);

    // ฟังก์ชันอัปเดตรายการฟอนต์ในหน้าต่าง
    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        savedFonts.forEach((font, index) => {
            const item = jQuery(`
                <div class="font-list-item">
                    <span class="font-preview" style="font-family:'${font.name}'">${font.name}</span>
                    <div>
                        <button class="baby-btn" style="padding:2px 8px; font-size:0.8em;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                        <button class="baby-btn" style="background:#ff4d4d; color:white; padding:2px 8px; font-size:0.8em;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    }

    // --- Event Listeners ---

    openBtn.on('click', () => {
        updateFontList();
        jQuery('#baby-font-manager-modal').fadeIn();
    });

    jQuery('#baby-close-btn').on('click', () => jQuery('#baby-font-manager-modal').fadeOut());

    jQuery('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = jQuery('#baby-font-name').val();

        if (fileInput.files.length === 0 || !nameInput) {
            toastr.error("อย่าลืมเลือกไฟล์และตั้งชื่อฟอนต์นะครับ!", "แจ้งเตือน");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            savedFonts.push({ name: nameInput, data: fontData });
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));

            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("บันทึกฟอนต์เรียบร้อยครับ!", "สำเร็จ");

            // เคลียร์ค่า
            fileInput.value = '';
            jQuery('#baby-font-name').val('');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    // Expose functions to window so buttons can call them
    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        savedFonts.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(savedFonts));
        updateFontList();
    };
});