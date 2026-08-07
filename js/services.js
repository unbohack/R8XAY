// Modal Management
const modal = document.getElementById('orderModal');
const closeBtn = document.querySelector('.close');

function openOrderModal(packageType) {
    const packageInput = document.getElementById('packageType') || document.getElementById('serviceType');
    if (packageInput) {
        packageInput.value = packageType;
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeOrderModal);
}

if (modal) {
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeOrderModal();
        }
    });
}

// Order Form Handler
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(orderForm);
        const data = Object.fromEntries(formData);
        
        console.log('Order Data:', data);
        
        // Show loading state
        const submitBtn = orderForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
        submitBtn.disabled = true;
        
        try {
            // Determine which API endpoint to use
            let endpoint = '/api/orders';
            
            // For IMEI page, use IMEI endpoint
            if (window.location.pathname.includes('imei.html')) {
                endpoint = '/api/imei/order';
            } else if (window.location.pathname.includes('iphone') || window.location.pathname.includes('icloud')) {
                endpoint = '/api/iphone/order';
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ ${result.message}\n\nرقم الطلب: ${result.orderId}\nالوقت المتوقع: ${result.estimatedTime || '24-48 ساعة'}`);
                closeOrderModal();
                orderForm.reset();
            } else {
                alert(`❌ ${result.message || 'حدث خطأ أثناء معالجة طلبك'}`);
            }
        } catch (error) {
            console.error('Order Error:', error);
            alert('❌ حدث خطأ في الاتصال. يرجى المحاولة لاحقاً أو التواصل معنا مباشرة');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Start Chat Function
function startChat() {
    alert('سيتم فتح نافذة الدردشة المباشرة قريباً. يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف في الوقت الحالي.');
}

// Animate pricing cards on scroll
const pricingCards = document.querySelectorAll('.pricing-card');
pricingCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
});

const pricingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

pricingCards.forEach(card => pricingObserver.observe(card));

// Animate feature items
const featureItems = document.querySelectorAll('.feature-item');
featureItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-30px)';
    item.style.transition = `all 0.5s ease-out ${index * 0.1}s`;
});

const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
        }
    });
}, { threshold: 0.1 });

featureItems.forEach(item => featureObserver.observe(item));
