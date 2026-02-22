AOS.init({ duration: 800, once: true });

const translations = {
    ru: {
        nav_about: "О НАС",
        nav_services: "УСЛУГИ",
        nav_gallery: "ГАЛЕРЕЯ",
        nav_contacts: "КОНТАКТЫ",
        hero_desc: "Профессиональные теннисные корты с покрытием Hard и премиальным сервисом.",
        btn_book: "ЗАБРОНИРОВАТЬ",
        about_p1: "Meridian Tennis — современный теннисный комплекс, созданный для профессионалов и любителей. Мы работаем с 2021 года и предлагаем идеальные условия для тренировок и активного отдыха.",
        about_p2: "Для удобства гостей у нас есть аренда теннисного инвентаря, видеонаблюдение для родителей, мини-бар, раздевалки и ежемесячные турниры.",
        service_1_title: "Теннисные турниры",
        service_1_desc: "для разных возрастов и уровней подготовки — от начинающих до опытных игроков.",
        service_2_title: "Аренда инвентаря",
        service_2_desc: "ракетки, мячи и всё необходимое для комфортных тренировок и игр.",
        service_3_title: "Кондиционированные корты",
        service_3_desc: "поддерживается комфортная температура в любое время года.",
        form_addr_label: "Адрес:",
        form_phone_label: "Телефон:",
        btn_send: "ОТПРАВИТЬ",
        btn_sending: "ОТПРАВКА...",
        btn_success: "УСПЕШНО",
        btn_error: "ОШИБКА",
        theme_light: "СВЕТЛЫЙ РЕЖИМ",
        theme_dark: "ТЕМНЫЙ РЕЖИМ"
    },
    uz: {
        nav_about: "BIZ HAQIMIZDA",
        nav_services: "XIZMATLAR",
        nav_gallery: "GALEREYA",
        nav_contacts: "ALOQA",
        hero_desc: "Hard qoplamali va premium servisga ega professional tennis kortlari.",
        btn_book: "BAND QILISH",
        about_p1: "Meridian Tennis — professionallar va havaskorlar uchun mo'ljallangan zamonaviy tennis majmuasi. Biz 2021-yildan beri mashg'ulotlar va faol dam olish uchun ideal sharoitlarni taklif etamiz.",
        about_p2: "Mehmonlar qulayligi uchun bizda inventar ijarasi, ota-onalar uchun kuzatuv kameralari, mini-bar va yechinish xonalari mavjud.",
        service_1_title: "Tennis turnirlari",
        service_1_desc: "turli yosh va tayyorgarlik darajalari uchun — yangi boshlanuvchilardan tajribali o'yinchilargacha.",
        service_2_title: "Inventar ijarasi",
        service_2_desc: "raketkalar, to'plar va qulay mashg'ulotlar uchun barcha zarur jihozlar.",
        service_3_title: "Konditsionerli kortlar",
        service_3_desc: "yilning istalgan vaqtida qulay harorat saqlanadi.",
        form_addr_label: "Manzil:",
        form_phone_label: "Telefon:",
        btn_send: "YUBORISH",
        btn_sending: "YUBORILMOQDA...",
        btn_success: "MUVAFFAQIYAT",
        btn_error: "XATOLIK",
        theme_light: "YORUG' REJIM",
        theme_dark: "TUNGI REJIM"
    },
    en: {
        nav_about: "ABOUT US",
        nav_services: "SERVICES",
        nav_gallery: "GALLERY",
        nav_contacts: "CONTACTS",
        hero_desc: "Professional Hard surface tennis courts with premium service.",
        btn_book: "BOOK NOW",
        about_p1: "Meridian Tennis is a modern tennis complex designed for professionals and amateurs. Operating since 2021, we offer perfect conditions for training and recreation.",
        about_p2: "For guests' convenience, we offer equipment rental, video monitoring for parents, a mini-bar, locker rooms, and monthly tournaments.",
        service_1_title: "Tennis Tournaments",
        service_1_desc: "for various ages and skill levels — from beginners to experienced players.",
        service_2_title: "Equipment Rental",
        service_2_desc: "rackets, balls, and everything you need for comfortable training and matches.",
        service_3_title: "Air-conditioned Courts",
        service_3_desc: "comfortable temperatures are maintained throughout the year.",
        form_addr_label: "Address:",
        form_phone_label: "Phone:",
        btn_send: "SEND",
        btn_sending: "SENDING...",
        btn_success: "SUCCESS",
        btn_error: "ERROR",
        theme_light: "LIGHT MODE",
        theme_dark: "DARK MODE"
    }
};

const themeToggle = document.getElementById('themeToggle');
const themeText = document.getElementById('themeText');
const heroBg = document.getElementById('heroBg');
const logoImg = document.getElementById('logoImg');
let currentTheme = 'light';
let currentLang = 'ru';

function updateThemeElements() {
    if (themeText) themeText.innerText = translations[currentLang][currentTheme === 'light' ? 'theme_light' : 'theme_dark'];
    const bgPath = currentTheme === 'light' ? './bgimglight.png' : './bgimgdark.png';
    const logoPath = currentTheme === 'light' ? './logolight.png' : './logodark.png';
    if (heroBg) heroBg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)), url('${bgPath}')`;
    if (logoImg) logoImg.src = logoPath;
    
    if (currentTheme === 'dark') {
        themeToggle.classList.add('active');
    } else {
        themeToggle.classList.remove('active');
    }
}

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeElements();
});

document.querySelectorAll('.lang-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.lang-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        currentLang = link.getAttribute('data-lang');
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
        });
        updateThemeElements();
    });
});

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
if (menuToggle) menuToggle.addEventListener('click', () => mainNav.classList.toggle('active'));

const grid = document.getElementById('galleryGrid');
const dotsContainer = document.getElementById('galleryDots');
const images = document.querySelectorAll('.gal-img');
let currentIndex = 0;

if (grid && dotsContainer) {
    images.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
        currentIndex = index;
        grid.scrollTo({ left: grid.offsetWidth * index, behavior: 'smooth' });
        document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');
    if (nextBtn) nextBtn.onclick = () => goToSlide((currentIndex + 1) % images.length);
    if (prevBtn) prevBtn.onclick = () => goToSlide((currentIndex - 1 + images.length) % images.length);
}

const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Это запрещает открывать новую вкладку

        const formData = new FormData(this);
        submitBtn.disabled = true;
        submitBtn.innerText = translations[currentLang].btn_sending;

        // Отправляем данные на Getform через AJAX
        fetch("https://getform.io/f/broxxyva", {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json",
            },
        })
        .then(response => {
            if (response.ok) {
                // ДЕЛАЕМ КНОПКУ ЗЕЛЕНОЙ
                submitBtn.style.backgroundColor = "#28a745"; // Зеленый цвет
                submitBtn.style.color = "#ffffff";           // Белый текст
                submitBtn.innerText = translations[currentLang].btn_success; // Текст "УСПЕШНО"
                contactForm.reset(); // Очищаем поля
            } else {
                throw new Error();
            }
        })
        .catch(error => {
            submitBtn.style.backgroundColor = "#ff0000"; // Красный при ошибке
            submitBtn.innerText = translations[currentLang].btn_error;
        })
        .finally(() => {
            // Через 4 секунды возвращаем кнопку в обычный вид
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = ""; // Возвращает оригинальный цвет из CSS
                submitBtn.style.color = "";
                submitBtn.innerText = translations[currentLang].btn_send;
            }, 4000);
        });
    });
}