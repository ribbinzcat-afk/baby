jQuery(document).ready(function () {
    // ---------------------------------------------------------
    // 1. ตั้งค่าตัวแปรและโหลดข้อมูลเก่า (Setup & Config)
    // ---------------------------------------------------------
    const extensionName = "BabyFontManager";
    const storageKey = "BabyCustomFonts";

    let savedFonts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let currentFont = localStorage.getItem(storageKey + "_Active");
    let savedBtnPos = JSON.parse(localStorage.getItem(storageKey) || '{"top":"10px","right":"100px"}');

    // ---------------------------------------------------------
    // 2. ฟังก์ชันหลัก (Core Functions)
    // ---------------------------------------------------------

    // ฟังก์ชันฝัง CSS @font-face ลงในหน้าเว็บ
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

    // ฟังก์ชันเปลี่ยนฟอนต์ให้ทั้งหน้าเว็บ
    function applyFont(name) {
        if (!name) return;
        jQuery('body').css('font-family', `'${name}', sans-serif`);
        localStorage.setItem(storageKey + "_Active", name);
        toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วครับ!`, "Baby Font Manager");
    }

    // ฟังก์ชันอัปเดตรายการฟอนต์ในหน้าต่าง
    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        if (savedFonts.length === 0) {
            list.append('<div style="text-align:center; color:#888; font-style:italic; padding:10px;">ยังไม่มีฟอนต์เลยจ้า</div>');
        }
        savedFonts.forEach((font, index) => {
            const item = jQuery(`
                <div class="font-list-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                    <span class="font-preview" style="font-family:'${font.name}'; color: white; font-size: 1.1em;">${font.name}</span>
                    <div style="display:flex; gap:5px;">
                        <button style="background:#ff99b5; border:none; color:white; padding:4px 10px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                        <button style="background:rgba(255, 77, 77, 0.2); border:1px solid #ff4d4d; color:#ff4d4d; padding:4px 10px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    }

    // เริ่มต้นระบบ: โหลดฟอนต์ที่เคยบันทึกไว้
    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    // ---------------------------------------------------------
    // 3. สร้างหน้าตา UI (User Interface)
    // ---------------------------------------------------------

    // 3.1 เพิ่ม CSS ตกแต่งปุ่ม
    const customStyle = `
        <style>
            .baby-file-label {
                display: block; width: 100%; padding: 10px;
                background: rgba(255, 153, 181, 0.2);
                border: 1px dashed #ff99b5; border-radius: 8px;
                text-align: center; color: #ffb7c5; cursor: pointer;
                transition: all 0.3s ease; margin-top: 5px;
            }
            .baby-file-label:hover {
                background: rgba(255, 153, 181, 0.4); color: white; border-style: solid;
            }
            .baby-btn-pink {
                background: linear-gradient(45deg, #ff99b5, #ff5e7e);
                color: white; border: none; padding: 8px 15px;
                border-radius: 20px; cursor: pointer;
                box-shadow: 0 2px 5px rgba(255, 94, 126, 0.4);
                transition: transform 0.2s;
            }
            .baby-btn-pink:active { transform: scale(0.95); }
            #baby-font-upload { display: none; }
        </style>
    `;
    jQuery('head').append(customStyle);

    // 3.2 สร้างหน้าต่าง Modal (หน้าต่างหลัก)
    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width: 400px; max-height: 80vh; overflow-y: auto; background: rgba(20, 20, 20, 0.95); border: 2px solid #ff99b5; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(255, 153, 181, 0.3); backdrop-filter: blur(10px);">

            <!-- ส่วนหัว: ลากได้ -->
            <div id="baby-modal-header" style="cursor: grab; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,153,181,0.3);">
                <h3 style="color:#ff99b5; text-align:center; margin:0; pointer-events: none;">🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
                <div style="text-align:center; font-size: 0.8em; color: #888;">(ลากตรงนี้เพื่อย้ายตำแหน่ง)</div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="color: white; font-weight: bold;">1. เลือกไฟล์ฟอนต์ (.ttf / .otf)</label>
                <label for="baby-font-upload" class="baby-file-label">📂 จิ้มตรงนี้เพื่อเลือกไฟล์ฟอนต์ค่ะ</label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf">
                <div id="file-name-display" style="color: #ff99b5; font-size: 0.9em; margin-top: 5px; text-align: center; min-height: 1.2em;"></div>

                <label style="color: white; font-weight: bold; margin-top: 10px; display: block;">2. ตั้งชื่อฟอนต์</label>
                <input type="text" id="baby-font-name" placeholder="เช่น 'ลายมือน่ารัก'..." style="width:100%; margin-top:5px; background:rgba(255,255,255,0.1); color:white; border:1px solid #555; padding:8px; border-radius: 5px; outline: none;">

                <button id="baby-save-btn" class="baby-btn-pink" style="width:100%; margin-top:15px;">บันทึกฟอนต์ ✨</button>
            </div>

            <div style="border-top: 1px solid rgba(255,153,181,0.3); margin-top: 15px; padding-top: 10px;">
                <h4 style="color:white; margin: 0 0 10px 0;">รายการฟอนต์ที่มี:</h4>
                <div id="baby-font-list" style="max-height: 150px; overflow-y: auto; padding-right: 5px;"></div>
            </div>

            <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; color: white; font-size: 0.9em;">
                <input type="checkbox" id="baby-toggle-float" checked>
                <label for="baby-toggle-float" style="cursor: pointer;">แสดงปุ่มลอยฟ้า (Floating Button)</label>
            </div>

            <button id="baby-reset-btn" class="baby-btn" style="background:#ffcc00; color:black; width:100%; margin-top:5px; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">↺ คืนค่าฟอนต์เดิม (Reset)</button>
            <button id="baby-close-btn" style="background:transparent; border: 1px solid #555; color:#aaa; width:100%; margin-top:15px; padding: 8px; border-radius: 5px; cursor: pointer;">ปิดหน้าต่าง</button>
        </div>
    `;

    // ล้างของเก่าแล้วสร้างใหม่
    if (jQuery('#baby-font-manager-modal').length > 0) jQuery('#baby-font-manager-modal').remove();
    jQuery('body').append(modalHtml);

    // 3.3 สร้างปุ่มลอยฟ้า (Floating Button)
    if (jQuery('#baby-font-trigger-btn').length > 0) jQuery('#baby-font-trigger-btn').remove();
    const floatingBtn = jQuery(`<div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">🎀</div>`);

    floatingBtn.css({
        "position": "fixed",
        "top": savedBtnPos.top,
        "right": savedBtnPos.right,
        "left": savedBtnPos.left || "auto",
        "z-index": "10000",
        "cursor": "grab",
        "font-size": "24px",
        "background": "rgba(20, 20, 20, 0.6)",
        "border-radius": "50%",
        "width": "45px", "height": "45px",
        "display": "flex", "align-items": "center", "justify-content": "center",
        "backdrop-filter": "blur(5px)",
        "border": "2px solid #ff99b5",
        "box-shadow": "0 0 10px rgba(255, 153, 181, 0.5)",
        "user-select": "none"
    });
    jQuery('body').append(floatingBtn);

    // 3.4 สร้างปุ่มในเมนู Extensions (SillyTavern Menu)
    const menuBtn = jQuery(`
        <div class="list-group-item" id="baby-font-menu-item" title="เปิดหน้าต่างจัดการฟอนต์" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
            <span class="fa-solid fa-font" style="color: #ff99b5;"></span>
            <span>Baby Font Manager</span>
        </div>
    `);
    // เช็คก่อนว่ามีปุ่มนี้หรือยัง แล้วค่อยใส่
    if (jQuery('#baby-font-menu-item').length === 0) {
        jQuery('#extensions_menu').append(menuBtn);
    }

    // ---------------------------------------------------------
    // 4. จัดการ Logic การทำงาน (Logic & Events)
    // ---------------------------------------------------------

    // [Logic] ซ่อน/แสดงปุ่มลอยฟ้า
    const isFloatingHidden = localStorage.getItem("BabyFont_HideFloat") === "true";
    if (isFloatingHidden) {
        floatingBtn.hide();
        jQuery('#baby-toggle-float').prop('checked', false);
    }
    jQuery(document).on('change', '#baby-toggle-float', function() {
        if(this.checked) {
            floatingBtn.fadeIn();
            localStorage.setItem("BabyFont_HideFloat", "false");
        } else {
            floatingBtn.fadeOut();
            localStorage.setItem("BabyFont_HideFloat", "true");
        }
    });

    // [Logic] ลากปุ่มลอยฟ้า (Draggable Button)
    let isDraggingBtn = false;
    let offsetBtn = { x: 0, y: 0 };
    let isDragClick = false; // ตัวกันไม่ให้การลากกลายเป็นการคลิก

    floatingBtn.on('mousedown', function(e) {
        isDraggingBtn = true; isDragClick = false;
        offsetBtn.x = e.clientX - floatingBtn[0].getBoundingClientRect().left;
        offsetBtn.y = e.clientY - floatingBtn[0].getBoundingClientRect().top;
        floatingBtn.css('cursor', 'grabbing');
    });

    jQuery(document).on('mousemove', function(e) {
        if (isDraggingBtn) {
            isDragClick = true; e.preventDefault();
            const newTop = e.clientY - offsetBtn.y;
            const newLeft = e.clientX - offsetBtn.x;
            floatingBtn.css({ top: newTop + 'px', left: newLeft + 'px', right: 'auto' });
        }
    });

    jQuery(document).on('mouseup', function() {
        if (isDraggingBtn) {
            isDraggingBtn = false;
            floatingBtn.css('cursor', 'grab');
            const pos = { top: floatingBtn.css('top'), left: floatingBtn.css('left'), right: 'auto' };
            localStorage.setItem(storageKey + "_BtnPos", JSON.stringify(pos));
        }
    });

    // [Logic] ลากหน้าต่าง Modal (Draggable Modal)
    const modal = jQuery('#baby-font-manager-modal');
    const header = jQuery('#baby-modal-header');
    let isDraggingModal = false;
    let offsetModal = { x: 0, y: 0 };

    header.on('mousedown', function(e) {
        isDraggingModal = true;
        offsetModal.x = e.clientX - modal[0].getBoundingClientRect().left;
        offsetModal.y = e.clientY - modal[0].getBoundingClientRect().top;
        header.css('cursor', 'grabbing');
    });

    jQuery(document).on('mousemove', function(e) {
        if (isDraggingModal) {
            e.preventDefault();
            const newTop = e.clientY - offsetModal.y;
            const newLeft = e.clientX - offsetModal.x;
            modal.css({ top: newTop + 'px', left: newLeft + 'px', transform: 'none' });
        }
    });

    jQuery(document).on('mouseup', function() {
        if (isDraggingModal) {
            isDraggingModal = false;
            header.css('cursor', 'grab');
        }
    });

    // ---------------------------------------------------------
    // 5. Event Listeners (การกดปุ่มต่างๆ)
    // ---------------------------------------------------------

    // กดปุ่มลอยฟ้า -> เปิดหน้าต่าง
    floatingBtn.on('mouseup', () => {
        if (!isDragClick) {
            updateFontList();
            modal.fadeIn();
        }
    });

    // กดปุ่มในเมนู -> เปิดหน้าต่าง
    menuBtn.on('click', () => {
        updateFontList();
        modal.fadeIn();
    });

    // ปุ่มปิดหน้าต่าง
    jQuery('#baby-close-btn').on('click', () => modal.fadeOut());

    // แสดงชื่อไฟล์เมื่อเลือก
    jQuery(document).on('change', '#baby-font-upload', function() {
        const fileName = this.files[0] ? this.files[0].name : "";
        if (fileName) {
            jQuery('#file-name-display').text("✅ เลือกไฟล์: " + fileName);
            jQuery('.baby-file-label').css('border-style', 'solid').css('background', 'rgba(255, 153, 181, 0.4)');
        } else {
            jQuery('#file-name-display').text("");
        }
    });

    // ปุ่มบันทึกฟอนต์ (Save)
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
            jQuery('#file-name-display').text('');
            jQuery('.baby-file-label').css('background', 'rgba(255, 153, 181, 0.2)');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    // ปุ่มรีเซ็ตฟอนต์ (Reset) - แยกออกมาข้างนอกแล้ว!
    jQuery('#baby-reset-btn').on('click', () => {
        if(confirm('จะคืนค่าฟอนต์เป็นแบบเดิมใช่ไหมครับ?')) {
            jQuery('body').css('font-family', '');
            localStorage.removeItem(storageKey + "_Active");
            toastr.info("กลับมาใช้ฟอนต์ดั้งเดิมแล้วครับ!", "Reset");
        }
    });

    // ฟังก์ชัน Global ให้ปุ่มในรายการเรียกใช้ได้
    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        if(confirm('ลบฟอนต์นี้จริงๆ เหรอคะ?')) {
            savedFonts.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));
            updateFontList();
        }
    };
});