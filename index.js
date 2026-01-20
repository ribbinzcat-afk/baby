jQuery(document).ready(function () {
    // ---------------------------------------------------------
    // 1. ตั้งค่าตัวแปรและโหลดข้อมูลเก่า (Setup & Config)
    // ---------------------------------------------------------
    const extensionName = "BabyFontManager";
    const storageKey = "BabyCustomFonts";

    let savedFonts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let currentFont = localStorage.getItem(storageKey + "_Active");
    // โหลดตำแหน่งปุ่ม (ถ้าไม่มีให้ Default)
    let savedBtnPos = JSON.parse(localStorage.getItem(storageKey + "_BtnPos") || '{"top":"10px","right":"20px"}');

    // ---------------------------------------------------------
    // 2. ฟังก์ชันหลัก (Core Functions)
    // ---------------------------------------------------------

    function injectFont(name, dataUrl) {
        const styleId = `font-style-${name.replace(/\s+/g, '-')}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @font-face { font-family: '${name}'; src: url('${dataUrl}'); }
            `;
            document.head.appendChild(style);
        }
    }

    function applyFont(name) {
        if (!name) return;
        jQuery('body').css('font-family', `'${name}', sans-serif`);
        localStorage.setItem(storageKey + "_Active", name);
        toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วครับ!`, "Baby Font Manager");
    }

    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        if (savedFonts.length === 0) {
            list.append('<div style="text-align:center; color:#888; font-style:italic; padding:10px;">ยังไม่มีฟอนต์เลยจ้า</div>');
        }
        savedFonts.forEach((font, index) => {
            const item = jQuery(`
                <div class="font-list-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                    <span class="font-preview" style="font-family:'${font.name}'; color: white; font-size: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">${font.name}</span>
                    <div style="display:flex; gap:5px;">
                        <button style="background:#ff99b5; border:none; color:white; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                        <button style="background:rgba(255, 77, 77, 0.2); border:1px solid #ff4d4d; color:#ff4d4d; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    }

    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    // ---------------------------------------------------------
    // 3. สร้างหน้าตา UI (User Interface) - ปรับ CSS ให้ Responsive 📱
    // ---------------------------------------------------------

    const customStyle = `
        <style>
            .baby-file-label {
                display: block; width: 100%; padding: 15px; /* เพิ่มพื้นที่กด */
                background: rgba(255, 153, 181, 0.2);
                border: 1px dashed #ff99b5; border-radius: 8px;
                text-align: center; color: #ffb7c5; cursor: pointer;
                transition: all 0.3s ease; margin-top: 5px; font-size: 0.9em;
            }
            .baby-file-label:hover, .baby-file-label:active {
                background: rgba(255, 153, 181, 0.4); color: white; border-style: solid;
            }
            .baby-btn-pink {
                background: linear-gradient(45deg, #ff99b5, #ff5e7e);
                color: white; border: none; padding: 10px 15px; /* ปุ่มใหญ่ขึ้น */
                border-radius: 20px; cursor: pointer; width: 100%;
                box-shadow: 0 2px 5px rgba(255, 94, 126, 0.4);
                font-size: 1em; margin-top: 15px;
            }
            #baby-font-upload { display: none; }

            /* Responsive Modal: มือถือให้กว้างเกือบเต็มจอ */
            #baby-font-manager-modal {
                width: 90vw !important; /* กว้าง 90% ของจอ */
                max-width: 400px;       /* แต่ไม่เกิน 400px */
                max-height: 85vh;
            }
        </style>
    `;
    jQuery('head').append(customStyle);

    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; margin: 10px auto; z-index:9999; overflow-y: auto; background: rgba(20, 20, 20, 0.95); border: 2px solid #ff99b5; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(255, 153, 181, 0.3); backdrop-filter: blur(10px);">

            <div id="baby-modal-header" style="cursor: grab; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,153,181,0.3); touch-action: none;"> <!-- touch-action: none สำคัญมากสำหรับกันจอมือถือเลื่อนตาม -->
                <h3 style="color:#ff99b5; text-align:center; margin:0; pointer-events: none;">🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
                <div style="text-align:center; font-size: 0.8em; color: #888;">(ลากหัวข้อเพื่อย้าย)</div>
            </div>

            <div style="margin-bottom: 15px;">
                <label for="baby-font-upload" class="baby-file-label">📂 จิ้มเลือกไฟล์ฟอนต์</label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf">
                <div id="file-name-display" style="color: #ff99b5; font-size: 0.9em; margin-top: 5px; text-align: center; min-height: 1.2em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>

                <input type="text" id="baby-font-name" placeholder="ตั้งชื่อฟอนต์..." style="width:100%; margin-top:10px; background:rgba(255,255,255,0.1); color:white; border:1px solid #555; padding:10px; border-radius: 5px; outline: none;">
                <button id="baby-save-btn" class="baby-btn-pink">บันทึกฟอนต์ ✨</button>
            </div>

            <div style="border-top: 1px solid rgba(255,153,181,0.3); margin-top: 15px; padding-top: 10px;">
                <h4 style="color:white; margin: 0 0 10px 0;">รายการฟอนต์:</h4>
                <div id="baby-font-list" style="max-height: 150px; overflow-y: auto; padding-right: 5px;"></div>
            </div>

            <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; color: white; font-size: 0.9em;">
                <input type="checkbox" id="baby-toggle-float" checked style="transform: scale(1.2);">
                <label for="baby-toggle-float">แสดงปุ่มลอยฟ้า</label>
            </div>

            <button id="baby-reset-btn" style="background:#ffcc00; color:black; width:100%; margin-top:10px; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">↺ คืนค่าเดิม (Reset)</button>
            <button id="baby-close-btn" style="background:transparent; border: 1px solid #555; color:#aaa; width:100%; margin-top:10px; padding: 10px; border-radius: 5px; cursor: pointer;">ปิดหน้าต่าง</button>
        </div>
    `;

    if (jQuery('#baby-font-manager-modal').length > 0) jQuery('#baby-font-manager-modal').remove();
    jQuery('body').append(modalHtml);

    // สร้างปุ่มลอยฟ้า
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
        "width": "50px", "height": "50px", // ใหญ่ขึ้นนิดนึงสำหรับนิ้ว
        "display": "flex", "align-items": "center", "justify-content": "center",
        "backdrop-filter": "blur(5px)",
        "border": "2px solid #ff99b5",
        "box-shadow": "0 0 10px rgba(255, 153, 181, 0.5)",
        "user-select": "none",
        "touch-action": "none" // ห้ามเลื่อนจอเวลาลากปุ่ม
    });
    jQuery('body').append(floatingBtn);

    // ---------------------------------------------------------
    // 4. Logic & Events (เพิ่ม Touch Support 👆)
    // ---------------------------------------------------------

    // Logic ซ่อน/แสดงปุ่ม
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

    // --- Universal Drag Logic (รองรับทั้ง Mouse และ Touch) ---
    function makeDraggable(element, handle, savePosKey) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // เริ่มลาก (Start)
        function dragStart(e) {
            // ถ้าเป็น Touch ให้เอาตำแหน่งนิ้วแรก, ถ้าเป็น Mouse ให้เอาตำแหน่งเมาส์
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            isDragging = true;
            startX = clientX;
            startY = clientY;

            const rect = element[0].getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            element.css('cursor', 'grabbing');
            // e.preventDefault(); // อย่าเพิ่งใส่ตรงนี้ เดี๋ยวพิมพ์ไม่ได้
        }

        // กำลังลาก (Move)
        function dragMove(e) {
            if (!isDragging) return;
            e.preventDefault(); // กันหน้าจอเลื่อนตาม

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            element.css({
                top: (initialTop + dy) + 'px',
                left: (initialLeft + dx) + 'px',
                right: 'auto', // ยกเลิกค่า right เพื่อให้ left ทำงาน
                transform: 'none'
            });
        }

        // จบการลาก (End)
        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            element.css('cursor', 'grab');

            // บันทึกตำแหน่งถ้ามี Key
            if (savePosKey) {
                const pos = { top: element.css('top'), left: element.css('left'), right: 'auto' };
                localStorage.setItem(savePosKey, JSON.stringify(pos));
            }
        }

        // ผูก Events ทั้ง Mouse และ Touch
        handle.on('mousedown touchstart', dragStart);
        jQuery(document).on('mousemove touchmove', dragMove);
        jQuery(document).on('mouseup touchend', dragEnd);
    }

    // เรียกใช้ฟังก์ชันลากกับปุ่มและหน้าต่าง
    makeDraggable(floatingBtn, floatingBtn, storageKey + "_BtnPos");
    makeDraggable(jQuery('#baby-font-manager-modal'), jQuery('#baby-modal-header'), null);


    // ---------------------------------------------------------
    // 5. General Listeners
    // ---------------------------------------------------------

    // คลิกปุ่มเปิด (แก้บั๊ก Touch แล้วกลายเป็น Click)
    let isDragAction = false;
    floatingBtn.on('touchmove mousemove', () => { isDragAction = true; });
    floatingBtn.on('touchstart mousedown', () => { isDragAction = false; });

    floatingBtn.on('mouseup touchend', (e) => {
        // ถ้าไม่ได้ลาก (คือการจิ้มเฉยๆ) ให้เปิดหน้าต่าง
        if (!isDragAction) {
            // กัน event ซ้ำซ้อน (เช่น touch แล้ว mouse ตามมา)
            if(e.type === 'touchend') e.preventDefault();

            updateFontList();
            jQuery('#baby-font-manager-modal').fadeIn();
        }
    });

    jQuery('#baby-close-btn').on('click', () => jQuery('#baby-font-manager-modal').fadeOut());

    jQuery(document).on('change', '#baby-font-upload', function() {
        const fileName = this.files[0] ? this.files[0].name : "";
        if (fileName) {
            jQuery('#file-name-display').text("✅ " + fileName);
            jQuery('.baby-file-label').css({background: 'rgba(255, 153, 181, 0.4)', borderStyle: 'solid'});
        } else {
            jQuery('#file-name-display').text("");
        }
    });

    jQuery('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = jQuery('#baby-font-name').val();

        if (fileInput.files.length === 0 || !nameInput) {
            toastr.error("กรุณาเลือกไฟล์และตั้งชื่อฟอนต์", "แจ้งเตือน");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            savedFonts.push({ name: nameInput, data: fontData });
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));
            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("บันทึกเรียบร้อย!", "สำเร็จ");

            fileInput.value = '';
            jQuery('#baby-font-name').val('');
            jQuery('#file-name-display').text('');
            jQuery('.baby-file-label').css('background', 'rgba(255, 153, 181, 0.2)');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    jQuery('#baby-reset-btn').on('click', () => {
        if(confirm('คืนค่าฟอนต์เดิม?')) {
            jQuery('body').css('font-family', '');
            localStorage.removeItem(storageKey + "_Active");
            toastr.info("รีเซ็ตเรียบร้อย", "Reset");
        }
    });

    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        if(confirm('ลบฟอนต์นี้?')) {
            savedFonts.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));
            updateFontList();
        }
    };

    // --- ส่วนเพิ่มปุ่มในเมนู (Hacker Search 🕸️) ---
    function createMenuBtn() {
        return jQuery(`
            <div class="list-group-item baby-font-menu-item" title="จัดการฟอนต์" style="cursor: pointer; display: flex; align-items: center; gap: 10px; border-left: 3px solid #ff99b5; background: rgba(255, 153, 181, 0.1); margin-bottom: 2px; padding: 10px; border-radius: 10px;">
                <span class="fa-solid fa-font" style="color: #ff99b5;"></span>
                <span style="font-weight: bold; color: #ccc;">คลังฟอนต์ของคุณเบบี้ 🎀</span>
            </div>
        `);
    }

    const checkMenuInterval = setInterval(() => {
        const possibleTargets = ['#extensions_settings', '#extensions_menu', '#rm_extensions_block', '.extensions_menu', '#top-bar'];
        possibleTargets.forEach(selector => {
            const target = jQuery(selector);
            if (target.length > 0 && target.find('.baby-font-menu-item').length === 0) {
                const btn = createMenuBtn();
                if (selector === '#top-bar') {
                    btn.css({ 'width': 'auto', 'border': 'none', 'background': 'transparent', 'padding': '0 10px' });
                    btn.html('<span class="fa-solid fa-font" style="color: #ff99b5; font-size: 1.2em;"></span>');
                }
                target.append(btn);
                btn.on('click', () => { updateFontList(); jQuery('#baby-font-manager-modal').fadeIn(); });
            }
        });
    }, 2000);
});