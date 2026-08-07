// IMEI Checker Functionality
const imeiCheckForm = document.getElementById('imeiCheckForm');
const imeiResult = document.getElementById('imeiResult');

if (imeiCheckForm) {
    imeiCheckForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imeiNumber = document.getElementById('imeiNumber').value;
        
        // Validate IMEI number
        if (imeiNumber.length !== 15 || !/^\d+$/.test(imeiNumber)) {
            alert('الرجاء إدخال رقم IMEI صحيح (15 رقم)');
            return;
        }
        
        // Show loading state
        const submitBtn = imeiCheckForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الفحص...';
        submitBtn.disabled = true;
        
        try {
            // Call real API
            const response = await fetch('/api/imei/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imei: imeiNumber })
            });

            const result = await response.json();

            if (result.success) {
                displayIMEIResults(result.data);
            } else {
                alert(result.message || 'حدث خطأ أثناء فحص IMEI');
            }
        } catch (error) {
            console.error('Error checking IMEI:', error);
            alert('حدث خطأ في الاتصال. يرجى المحاولة لاحقاً');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// IMEI Input Formatter - Only allow numbers
const imeiInput = document.getElementById('imeiNumber');
if (imeiInput) {
    imeiInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// Display IMEI Results
function displayIMEIResults(data) {
    const resultDetails = document.querySelector('.result-details');
    
    // Handle basic check (when full data is not available)
    if (data.basicCheck) {
        resultDetails.innerHTML = `
            <div class="result-item">
                <strong>رقم IMEI:</strong>
                <span>${data.imei}</span>
            </div>
            <div class="result-item">
                <strong>الحالة:</strong>
                <span style="color: #10b981; font-weight: bold;">✓ IMEI صحيح</span>
            </div>
            <div class="result-item" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; color: #856404;">
                    <i class="fas fa-info-circle"></i> ${data.message}
                </p>
            </div>
        `;
    } else {
        // Full detailed results
        const statusColor = data.status === 'نظيف' ? '#10b981' : data.status === 'غير معروف' ? '#6b7280' : '#ef4444';
        const networkColor = data.network === 'غير مقفل' || data.network === 'unlocked' ? '#10b981' : data.network === 'غير معروف' ? '#6b7280' : '#f59e0b';
        const warrantyColor = data.warranty === 'نشط' || data.warranty === 'active' ? '#10b981' : data.warranty === 'غير معروف' ? '#6b7280' : '#ef4444';
        
        let resultHTML = `
            <div class="result-item">
                <strong>رقم IMEI:</strong>
                <span>${data.imei}</span>
            </div>
            <div class="result-item">
                <strong>الحالة:</strong>
                <span style="color: #10b981; font-weight: bold;">✓ IMEI صحيح</span>
            </div>`;
        
        if (data.brand && data.brand !== 'N/A' && data.brand !== 'غير معروف') {
            resultHTML += `
            <div class="result-item">
                <strong>العلامة التجارية:</strong>
                <span style="font-weight: 600; color: #2563eb;">${data.brand}</span>
            </div>`;
        }
        
        if (data.model && data.model !== 'N/A' && !data.model.includes('غير معروف')) {
            resultHTML += `
            <div class="result-item">
                <strong>الموديل:</strong>
                <span style="font-weight: 600; color: #2563eb;">${data.model}</span>
            </div>`;
        }
        
        if (data.deviceType && data.deviceType !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>نوع الجهاز:</strong>
                <span>${data.deviceType}</span>
            </div>`;
        }
        
        if (data.status && data.status !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>حالة الجهاز:</strong>
                <span style="color: ${statusColor}; font-weight: bold;">${data.status}</span>
            </div>`;
        }
        
        if (data.network && data.network !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>قفل الشبكة:</strong>
                <span style="color: ${networkColor}; font-weight: bold;">${data.network}</span>
            </div>`;
        }
        
        if (data.warranty && data.warranty !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>الضمان:</strong>
                <span style="color: ${warrantyColor}; font-weight: bold;">${data.warranty}</span>
            </div>`;
        }
        
        if (data.color && data.color !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>اللون:</strong>
                <span>${data.color}</span>
            </div>`;
        }
        
        if (data.storage && data.storage !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>السعة:</strong>
                <span>${data.storage}</span>
            </div>`;
        }
        
        if (data.purchaseDate && data.purchaseDate !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>تاريخ الشراء:</strong>
                <span>${data.purchaseDate}</span>
            </div>`;
        }
        
        if (data.serial && data.serial !== 'N/A') {
            resultHTML += `
            <div class="result-item">
                <strong>الرقم التسلسلي:</strong>
                <span>${data.serial}</span>
            </div>`;
        }
        
        // Show source
        if (data.source) {
            resultHTML += `
            <div class="result-item" style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-top: 10px;">
                <small style="color: #6b7280;">
                    <i class="fas fa-database"></i> المصدر: ${data.source}
                </small>
            </div>`;
        }
        
        // Show note if available
        if (data.note) {
            resultHTML += `
            <div class="result-item" style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; color: #92400e;">
                    <i class="fas fa-info-circle"></i> ${data.note}
                </p>
            </div>`;
        }
        
        // If device not found in TAC database
        if (data.found === false) {
            resultHTML += `
            <div class="result-item" style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; color: #1e40af;">
                    <i class="fas fa-lightbulb"></i> 
                    <strong>هل تريد معلومات أكثر تفصيلاً؟</strong><br>
                    اطلب خدمة <strong>التقرير المتقدم</strong> للحصول على معلومات كاملة عن الجهاز، حالة iCloud، القائمة السوداء، والمزيد!
                </p>
            </div>`;
        }
        
        resultDetails.innerHTML = resultHTML;
    }
    
    imeiResult.style.display = 'block';
    imeiResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Animate result items
    const resultItems = resultDetails.querySelectorAll('.result-item');
    resultItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.4s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 50);
    });
}
