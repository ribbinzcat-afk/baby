jQuery(document).ready(function () {
    const extensionName = "BabyFontManager";
    const storageKey = "BabyCustomFonts";

    // --- ส่วนโหลดฟอนต์ (Logic เดิม) ---
    let savedFonts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let currentFont = localStorage.getItem(storageKey + "_Active");

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

    function applyFont(name) {
        if (!name) return;
        jQuery('body').css('font-family', `'${name}', sans-serif`);
        localStorage.setItem(storageKey + "_Active", name);
        toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วครับ!`, "Baby Font Manager");
    }

    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    // --- ส่วนสร้างหน้าต่าง UI (อัปเกรดปุ่มเลือกไฟล์!) ---

    // CSS สำหรับปุ่มสวยๆ และ Scrollbar
    const customStyle = `
        <style>
            .baby-file-label {
                display: block;
                width: 100%;
                padding: 10px;
                background: rgba(255, 153, 181, 0.2);
                border: 1px dashed #ff99b5;
                border-radius: 8px;
                text-align: center;
                color: #ffb7c5;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 5px;
            }
            .baby-file-label:hover {
                background: rgba(255, 153, 181, 0.4);
                color: white;
                border-style: solid;
            }
            .baby-btn-pink {
                background: linear-gradient(45deg, #ff99b5, #ff5e7e);
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 20px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(255, 94, 126, 0.4);
                transition: transform 0.2s;
            }
            .baby-btn-pink:active { transform: scale(0.95); }
            /* ซ่อน Input ตัวจริงที่หน้าตาไม่สวย */
            #baby-font-upload { display: none; }
        </style>
    `;
    jQuery('head').append(customStyle);

    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width: 400px; max-height: 80vh; overflow-y: auto; background: rgba(20, 20, 20, 0.95); border: 2px solid #ff99b5; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(255, 153, 181, 0.3); backdrop-filter: blur(10px);">

            <!-- ส่วนหัว: ลากได้ -->
            <div id="baby-modal-header" style="cursor: grab; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,153,181,0.3);">
                <h3 style="color:#ff99b5; text-align:center; margin:0; pointer-events: none;">🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
                <div style="text-align:center; font-size: 0.8em; color: #888;">(ลากตรงนี้เพื่อย้ายตำแหน่ง)</div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="color: white; font-weight: bold;">1. เลือกไฟล์ฟอนต์ (.ttf / .otf)</label>

                <!-- ปุ่มเลือกไฟล์แบบใหม่ ไฉไลกว่าเดิม -->
                <label for="baby-font-upload" class="baby-file-label">
                    📂 จิ้มตรงนี้เพื่อเลือกไฟล์ฟอนต์ค่ะ
                </label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf">
                <div id="file-name-display" style="color: #ff99b5; font-size: 0.9em; margin-top: 5px; text-align: center; min-height: 1.2em;"></div>

                <label style="color: white; font-weight: bold; margin-top: 10px; display: block;">2. ตั้งชื่อฟอนต์</label>
                <input type="text" id="baby-font-name" placeholder="เช่น 'ลายมือน่ารัก'..." style="width:100%; margin-top:5px; background:rgba(255,255,255,0.1); color:white; border:1px solid #555; padding:8px; border-radius: 5px; outline: none;">

                <button id="baby-save-btn" class="baby-btn-pink" style="width:100%; margin-top:15px;">บันทึกฟอนต์ ✨</button>
            </div>

            <div style="border-top: 1px solid rgba(255,153,181,0.3); margin-top: 15px; padding-top: 10px;">
                <h4 style="color:white; margin: 0 0 10px 0;">รายการฟอนต์ที่มี:</h4>
                <div id="baby-font-list" style="max-height: 150px; overflow-y: auto; padding-right: 5px;">
                    <!-- รายชื่อฟอนต์ -->
                </div>
            </div>

            <!-- 👇 เพิ่มส่วนนี้เข้าไปครับ: ตัวเลือกเปิด/ปิดปุ่มลอยฟ้า 👇 -->
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; color: white; font-size: 0.9em;">
                <input type="checkbox" id="baby-toggle-float" checked>
                <label for="baby-toggle-float" style="cursor: pointer;">แสดงปุ่มลอยฟ้า (Floating Button)</label>
            </div>
            <!-- 👆 จบส่วนที่เพิ่ม 👆 -->

            // เพิ่มปุ่มนี้เข้าไปครับ (สีส้มๆ จะได้ดูต่างจากปุ่มอื่น)
            <button id="baby-reset-btn" class="baby-btn" style="background:#ffcc00; color:black; width:100%; margin-top:5px; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">
    ↺ คืนค่าฟอนต์เดิม (Reset)
            </button>

            <button id="baby-close-btn" style="background:transparent; border: 1px solid #555; color:#aaa; width:100%; margin-top:15px; padding: 8px; border-radius: 5px; cursor: pointer;">ปิดหน้าต่าง</button>
        </div>
    `;

    if (jQuery('#baby-font-manager-modal').length > 0) jQuery('#baby-font-manager-modal').remove();
    jQuery('body').append(modalHtml);

    // --- ส่วนสร้างปุ่มลอยฟ้า (เหมือนเดิม) ---
    if (jQuery('#baby-font-trigger-btn').length > 0) jQuery('#baby-font-trigger-btn').remove();

    // โหลดตำแหน่งปุ่มที่จำไว้ (ถ้ามี)
    const savedBtnPos = JSON.parse(localStorage.getItem(storageKey + "_BtnPos") || '{"top":"10px","right":"100px"}');

    const floatingBtn = jQuery(`
        <div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">🎀</div>
    `);

    floatingBtn.css({
        "position": "fixed",
        "top": savedBtnPos.top,
        "right": savedBtnPos.right,
        "left": savedBtnPos.left || "auto", // กันเหนียว
        "z-index": "10000",
        "cursor": "grab",
        "font-size": "24px",
        "background": "rgba(20, 20, 20, 0.6)",
        "border-radius": "50%",
        "width": "45px",
        "height": "45px",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "backdrop-filter": "blur(5px)",
        "border": "2px solid #ff99b5",
        "box-shadow": "0 0 10px rgba(255, 153, 181, 0.5)",
        "user-select": "none"
    });

    jQuery('body').append(floatingBtn);

        // --- Logic สั่งซ่อน/แสดงปุ่มลอยฟ้า ---

    // โหลดค่าเดิมที่เคยตั้งไว้ (ถ้าเคยสั่งซ่อนไว้ ก็ให้ซ่อนเลยตอนเปิดมา)
    const isFloatingHidden = localStorage.getItem("BabyFont_HideFloat") === "true";

    if (isFloatingHidden) {
        jQuery('#baby-font-trigger-btn').hide(); // ซ่อนปุ่ม
        jQuery('#baby-toggle-float').prop('checked', false); // เอาติ๊กออก
    }

    // เมื่อกดติ๊กถูก/เอาออก
    jQuery(document).on('change', '#baby-toggle-float', function() {
        if(this.checked) {
            jQuery('#baby-font-trigger-btn').fadeIn(); // แสดงปุ่ม
            localStorage.setItem("BabyFont_HideFloat", "false");
        } else {
            jQuery('#baby-font-trigger-btn').fadeOut(); // ซ่อนปุ่ม
            localStorage.setItem("BabyFont_HideFloat", "true");
        }
    });

    // --- Logic การลากปุ่ม (Draggable Button) ---
    let isDraggingBtn = false;
    let offsetBtn = { x: 0, y: 0 };

    floatingBtn.on('mousedown', function(e) {
        isDraggingBtn = true;
        offsetBtn.x = e.clientX - floatingBtn[0].getBoundingClientRect().left;
        offsetBtn.y = e.clientY - floatingBtn[0].getBoundingClientRect().top;
        floatingBtn.css('cursor', 'grabbing');
    });

    jQuery(document).on('mousemove', function(e) {
        if (isDraggingBtn) {
            e.preventDefault();
            const newTop = e.clientY - offsetBtn.y;
            const newLeft = e.clientX - offsetBtn.x;
            floatingBtn.css({ top: newTop + 'px', left: newLeft + 'px', right: 'auto' });
        }
    });

    jQuery(document).on('mouseup', function() {
        if (isDraggingBtn) {
            isDraggingBtn = false;
            floatingBtn.css('cursor', 'grab');
            // จำตำแหน่งล่าสุดไว้
            const pos = { top: floatingBtn.css('top'), left: floatingBtn.css('left'), right: 'auto' };
            localStorage.setItem(storageKey + "_BtnPos", JSON.stringify(pos));
        }
    });

    // --- Logic การลากหน้าต่าง (Draggable Modal) ---
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
            // คำนวณตำแหน่งใหม่ (เอา transform ออกแล้วใช้ top/left ตรงๆ เพื่อความง่ายในการลาก)
            const newTop = e.clientY - offsetModal.y;
            const newLeft = e.clientX - offsetModal.x;

            // กันไม่ให้ลากตกจอ (Boundary Check)
            const maxTop = jQuery(window).height() - element.outerHeight();
            const maxLeft = jQuery(window).width() - element.outerWidth();

            modal.css({
                top: newTop + 'px',
                left: newLeft + 'px',
                transform: 'none' // ยกเลิก translate เดิม
            });
        }
    });

    jQuery(document).on('mouseup', function() {
        if (isDraggingModal) {
            isDraggingModal = false;
            header.css('cursor', 'grab');
        }
    });

    // --- Event Listeners ---

    // โชว์ชื่อไฟล์เมื่อเลือกเสร็จ
    jQuery(document).on('change', '#baby-font-upload', function() {
        const fileName = this.files[0] ? this.files[0].name : "";
        if (fileName) {
            jQuery('#file-name-display').text("✅ เลือกไฟล์: " + fileName);
            jQuery('.baby-file-label').css('border-style', 'solid').css('background', 'rgba(255, 153, 181, 0.4)');
        } else {
            jQuery('#file-name-display').text("");
        }
    });

    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        if (savedFonts.length === 0) {
            list.append('<div style="text-align:center; color:#666; font-style:italic; padding:10px;">ยังไม่มีฟอนต์เลยจ้า</div>');
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

    // คลิกปุ่มเปิดหน้าต่าง (ป้องกันการลากแล้วกลายเป็นการคลิก)
    let isDragClick = false;
    floatingBtn.on('mousedown', () => { isDragClick = false; });
    floatingBtn.on('mousemove', () => { isDragClick = true; });
    floatingBtn.on('mouseup', () => {
        if (!isDragClick) {
            updateFontList();
            modal.fadeIn();
            // รีเซ็ตตำแหน่ง Modal ให้มากลางจอถ้าเพิ่งเปิดครั้งแรก หรือถ้ามันหลุดจอไป
            if (modal.css('display') !== 'none' && modal.css('transform') !== 'none') {
                // ถ้ายังไม่ได้ลาก (ยังมี transform) ให้ปล่อยไว้
            }
        }
    });

    jQuery('#baby-close-btn').on('click', () => modal.fadeOut());

    jQuery('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = jQuery('#baby-font-name').val();

        if (fileInput.files.length === 0 || !nameInput) {
            toastr.error("อย่าลืมเลือกไฟล์และตั้งชื่อฟอนต์นะครับ!", "แจ้งเตือน");
            return;
        }

            // เมื่อกดปุ่ม Reset
    jQuery('#baby-reset-btn').on('click', () => {
        // 1. ล้างค่า CSS ที่เราเคยสั่ง body ไว้ (ให้กลับไปเป็นค่าว่าง)
        jQuery('body').css('font-family', '');

        // 2. ลบความจำว่าเราเคยเลือกฟอนต์อะไรไว้
        localStorage.removeItem(storageKey + "_Active");

        // 3. แจ้งเตือน
        toastr.info("กลับมาใช้ฟอนต์ดั้งเดิมแล้วครับ!", "Reset");
         });

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            savedFonts.push({ name: nameInput, data: fontData });
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));

            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("บันทึกฟอนต์เรียบร้อยครับ!", "สำเร็จ");

            fileInput.value = '';
            jQuery('#baby-font-name').val('');
            jQuery('#file-name-display').text('');
            jQuery('.baby-file-label').css('background', 'rgba(255, 153, 181, 0.2)');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        if(confirm('ลบฟอนต์นี้จริงๆ เหรอคะ?')) {
            savedFonts.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));
            updateFontList();
        }
    };

        // --- ส่วนเพิ่มปุ่มในเมนู Extensions (SillyTavern Menu) ---

    // สร้างปุ่มในรายการ
    const menuBtn = jQuery(`
        <div class="list-group-item" id="baby-font-menu-item" title="เปิดหน้าต่างจัดการฟอนต์" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
            <span class="fa-solid fa-font" style="color: #ff99b5;"></span>
            <span>Baby Font Manager</span>
        </div>
    `);

    // เช็คก่อนว่ามีปุ่มนี้หรือยัง (กันเบิ้ล) แล้วค่อยยัดเข้าไปในเมนู
    if (jQuery('#baby-font-menu-item').length === 0) {
        jQuery('#extensions_menu').append(menuBtn);
    }

    // กดปุ่มในเมนูแล้วเปิดหน้าต่างเหมือนกัน
    menuBtn.on('click', () => {
        updateFontList();
        jQuery('#baby-font-manager-modal').fadeIn();
    });

});