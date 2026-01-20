jQuery(document).ready(function () {
    const extensionName = "BabyFontManager";
    const storageKey = "BabyCustomFonts";
    const btnStorageKey = "BabyFontBtnPos"; // จำตำแหน่งปุ่ม
    const modalStorageKey = "BabyFontModalPos"; // จำตำแหน่งหน้าต่าง (เพิ่มใหม่!)

    // --- 1. โหลดฟอนต์ (Logic เดิม) ---
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

    // --- 2. สร้างหน้าต่าง UI (Modal) ---
    // ปรับ CSS ให้เริ่มต้นที่กลางจอเป๊ะๆ และไม่ใช้ transform ที่อาจทำให้คำนวณตำแหน่งผิดตอนลาก
    const modalHtml = `
        <div id="baby-font-manager-modal" style="display:none; position:fixed; top:100px; left:100px; z-index:9999; width: 400px; max-height: 80vh; display: flex; flex-direction: column; background: rgba(25, 25, 35, 0.95); border: 1px solid rgba(255, 153, 181, 0.5); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); backdrop-filter: blur(10px);">

            <!-- ส่วนหัว (ใช้สำหรับจับลาก) -->
            <div id="baby-modal-header" style="padding: 15px; cursor: move; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(255, 153, 181, 0.1); border-radius: 16px 16px 0 0;">
                <h3 style="margin:0; color:#ffb7b2; font-size: 1.1em; font-weight: bold; pointer-events: none;">🎀 คลังฟอนต์ของคุณเบบี้</h3>
                <button id="baby-close-btn" style="background:none; border:none; color:#ffb7b2; font-size:1.5em; cursor:pointer; line-height: 1;">&times;</button>
            </div>

            <!-- ส่วนเนื้อหา (Scroll ได้ถ้ามันยาว) -->
            <div style="padding: 20px; overflow-y: auto; flex-grow: 1;">
                <div style="margin-bottom: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                    <label style="color: #ddd; font-size: 0.9em; display:block; margin-bottom:5px;">📂 อัปโหลดฟอนต์ (.ttf/.otf)</label>
                    <input type="file" id="baby-font-upload" accept=".ttf,.otf" placeholder="เลือกไฟล์" style="width:100%; margin-bottom:10px; color: #aaa; font-size: 0.8em;">
                    <input type="text" id="baby-font-name" placeholder="ตั้งชื่อฟอนต์น่ารักๆ..." style="width:100%; background:#333; color:white; border:1px solid #555; padding:8px 12px; border-radius: 8px; box-sizing: border-box;">
                    <button id="baby-save-btn" style="width:100%; margin-top:10px; background: linear-gradient(45deg, #ff99b5, #ffb7b2); color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: transform 0.1s;">✨ บันทึกฟอนต์</button>
                </div>

                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px;"></div>
                <label style="color: #ffb7b2; font-size: 0.9em; margin-bottom: 10px; display:block;">รายการฟอนต์ที่มี:</label>

                <div id="baby-font-list" style="max-height: 250px; overflow-y: auto; padding-right: 5px;">
                    <!-- รายชื่อฟอนต์ -->
                </div>
            </div>
        </div>
    `;

    if (jQuery('#baby-font-manager-modal').length > 0) jQuery('#baby-font-manager-modal').remove();
    jQuery('body').append(modalHtml);

    // --- 3. ฟังก์ชันทำให้ลากได้ (Draggable) ---
    function makeDraggable(element, handle, storageKey) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // โหลดตำแหน่งเดิมถ้ามี
        const savedPos = JSON.parse(localStorage.getItem(storageKey));
        if (savedPos) {
            element.css({ top: savedPos.top, left: savedPos.left });
        } else {
            // ถ้าไม่มี ให้จัดกลางจอ (เฉพาะ Modal)
            if (element.attr('id') === 'baby-font-manager-modal') {
                const winH = jQuery(window).height();
                const winW = jQuery(window).width();
                element.css({ top: (winH/2 - 200) + 'px', left: (winW/2 - 200) + 'px' });
            }
        }

        handle.on('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(element.css('left')) || 0;
            initialTop = parseInt(element.css('top')) || 0;
            element.css('cursor', 'grabbing');
            e.preventDefault(); // กันเลือก Text
        });

        jQuery(document).on('mousemove', function(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // คำนวณตำแหน่งใหม่
            let newTop = initialTop + dy;
            let newLeft = initialLeft + dx;

            // กันไม่ให้ลากตกจอ (Boundary Check)
            const maxTop = jQuery(window).height() - element.outerHeight();
            const maxLeft = jQuery(window).width() - element.outerWidth();

            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;
            if (newTop > maxTop) newTop = maxTop;
            if (newLeft > maxLeft) newLeft = maxLeft;

            element.css({ top: newTop, left: newLeft });
        });

        jQuery(document).on('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                element.css('cursor', 'default');
                // จำตำแหน่งล่าสุดไว้
                localStorage.setItem(storageKey, JSON.stringify({
                    top: element.css('top'),
                    left: element.css('left')
                }));
            }
        });
    }

    // --- 4. สร้างปุ่มลอย (Floating Button) ---
    if (jQuery('#baby-font-trigger-btn').length > 0) jQuery('#baby-font-trigger-btn').remove();

    const floatingBtn = jQuery(`
        <div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">🅰️</div>
    `);

    floatingBtn.css({
        "position": "fixed",
        "z-index": "10000",
        "cursor": "pointer",
        "font-size": "24px",
        "background": "rgba(255, 153, 181, 0.2)",
        "border-radius": "50%",
        "width": "45px",
        "height": "45px",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "backdrop-filter": "blur(5px)",
        "border": "1px solid rgba(255, 153, 181, 0.6)",
        "box-shadow": "0 4px 10px rgba(0,0,0,0.2)",
        "transition": "transform 0.2s"
    });

    // Hover Effect
    floatingBtn.hover(
        function() { jQuery(this).css("transform", "scale(1.1)"); },
        function() { jQuery(this).css("transform", "scale(1.0)"); }
    );

    jQuery('body').append(floatingBtn);

    // --- 5. เปิดใช้งานระบบลาก (Activate Magic!) ---
    // ทำให้ปุ่มลากได้
    makeDraggable(floatingBtn, floatingBtn, btnStorageKey);
    // ทำให้ Modal ลากได้ (จับที่ Header)
    makeDraggable(jQuery('#baby-font-manager-modal'), jQuery('#baby-modal-header'), modalStorageKey);


    // --- 6. Event Listeners ---
    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        savedFonts.forEach((font, index) => {
            const item = jQuery(`
                <div class="font-list-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: rgba(255,255,255,0.08); padding: 8px 12px; border-radius: 8px; transition: background 0.2s;">
                    <span class="font-preview" style="font-family:'${font.name}'; color: #eee; font-size: 1.1em;">${font.name}</span>
                    <div style="display:flex; gap:5px;">
                        <button style="background:#ff99b5; border:none; color:#333; padding:4px 10px; border-radius:5px; cursor:pointer; font-size:0.8em; font-weight:bold;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                        <button style="background:rgba(255, 77, 77, 0.2); border:1px solid #ff4d4d; color:#ff4d4d; padding:4px 10px; border-radius:5px; cursor:pointer; font-size:0.8em;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    }

    // คลิกปุ่มเพื่อเปิด/ปิด Modal (แก้ Logic นิดหน่อยให้กดซ้ำแล้วปิดได้)
    let isModalOpen = false;
    floatingBtn.on('click', (e) => {
        // เช็คว่าเป็นการคลิกจริงๆ ไม่ใช่การลากเสร็จแล้วปล่อย
        if (floatingBtn.css('cursor') === 'grabbing') return;

        const modal = jQuery('#baby-font-manager-modal');
        if (modal.is(':visible')) {
            modal.fadeOut();
        } else {
            updateFontList();
            modal.fadeIn();
        }
    });

    jQuery('#baby-close-btn').on('click', () => jQuery('#baby-font-manager-modal').fadeOut());

    jQuery('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = jQuery('#baby-font-name').val();

        if (fileInput.files.length === 0 || !nameInput) {
            toastr.error("⚠️ อย่าลืมเลือกไฟล์และตั้งชื่อฟอนต์นะครับ!", "แจ้งเตือน");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            savedFonts.push({ name: nameInput, data: fontData });
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));

            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("✨ บันทึกฟอนต์เรียบร้อยครับ!", "สำเร็จ");

            fileInput.value = '';
            jQuery('#baby-font-name').val('');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        savedFonts.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(savedFonts));
        updateFontList();
    };
});