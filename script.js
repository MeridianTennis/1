/**
 * Meridian Tennis — front-end
 * ---------------------------------------------------------------------------
 * Vanilla ES2018+, no dependencies. Every module is independent and guards
 * against missing markup, so a partial page never throws.
 *
 *  1.  Helpers
 *  2.  i18n dictionary
 *  3.  i18n engine
 *  4.  Theme
 *  5.  Header: scroll state, progress bar, scrollspy
 *  6.  Mobile navigation
 *  7.  Reveal on scroll
 *  8.  Counters
 *  9.  FAQ accordion
 * 10.  Gallery lightbox
 * 11.  Contact form
 * 12.  Back to top / misc
 */
(function () {
    'use strict';

    /* ======================================================================
       0. CONFIGURATION  ← заявки с формы приходят сюда
       ======================================================================

       ┌─ ВАРИАНТ A (безопасный, рекомендуется) ────────────────────────────┐
       │ Разверните telegram-proxy.js как Cloudflare Worker (бесплатно,     │
       │ ~5 минут — инструкция в README.md) и впишите его адрес в           │
       │ telegram.proxyUrl. Токен бота останется на сервере.                │
       └────────────────────────────────────────────────────────────────────┘

       ┌─ ВАРИАНТ B (быстрый, НЕбезопасный) ────────────────────────────────┐
       │ Впишите botToken прямо сюда. Работать будет сразу, НО этот файл    │
       │ открыт всем посетителям сайта — токен смогут прочитать и           │
       │ использовать. Годится только для теста.                            │
       └────────────────────────────────────────────────────────────────────┘

       Как получить значения:
         botToken — напишите @BotFather → /newbot → он выдаст токен
         chatId   — напишите своему боту любое сообщение, затем откройте
                    @userinfobot и он покажет ваш числовой ID.
                    ВАЖНО: «@ao7uz» подставить нельзя — Telegram принимает
                    @username только для публичных каналов, для личного
                    аккаунта нужен именно числовой ID.
    */
    var CONFIG = {
        telegram: {
            // Вариант A — если развернёте telegram-proxy.js, впишите адрес
            // сюда, а botToken ниже очистите.
            proxyUrl: '',

            // Вариант B — работает прямо сейчас.
            // ⚠️ ВНИМАНИЕ: этот файл открыт всем посетителям сайта, поэтому
            //    токен ниже виден любому. Сейчас так сделано, чтобы форма
            //    заработала сразу. Как только будет время — перенесите
            //    отправку на воркер (README.md, раздел 1, вариант A)
            //    и перевыпустите токен через @BotFather → /revoke.
            botToken: '8712844117:AAHrkcFtjotnyq7jBlwb_0EAzvnqpOCK_5I',

            // Числовой ID аккаунта-получателя заявок (@I700077).
            chatId: '8524579382'
        }
    };


    /* ======================================================================
       1. HELPERS
       ====================================================================== */

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    /** localStorage that never throws (private mode / disabled storage). */
    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* noop */ } }
    };

    /** Run fn on the next animation frame, at most once per frame. */
    function rafThrottle(fn) {
        var queued = false;
        return function () {
            if (queued) return;
            queued = true;
            requestAnimationFrame(function () {
                queued = false;
                fn();
            });
        };
    }

    /** Keep Tab focus inside `container` while it is open. */
    function trapFocus(container, event) {
        var items = $$(FOCUSABLE, container).filter(function (el) {
            return el.offsetParent !== null || el === document.activeElement;
        });
        if (!items.length) return;

        var first = items[0];
        var last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    /* Body scroll lock, reference-counted so the drawer and the lightbox
       can never unlock each other prematurely.

       `overflow: hidden` on the body is silently ignored by iOS Safari —
       the page carries on scrolling behind the drawer and the lightbox.
       Taking the body out of flow does hold, at the cost of having to
       remember the offset and put it back by hand. */
    var lockCount = 0;
    var lockedY = 0;
    var scrollLocked = false;

    /** Scrolls without honouring `scroll-behavior: smooth`. */
    function jumpTo(y) {
        var root = document.documentElement;
        var prev = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, y);
        root.style.scrollBehavior = prev;
    }

    function lockScroll() {
        if (lockCount++ === 0) {
            lockedY = window.scrollY || window.pageYOffset || 0;
            scrollLocked = true;

            // Compensate for the scrollbar the lock is about to remove.
            var sbw = window.innerWidth - document.documentElement.clientWidth;
            if (sbw > 0) document.body.style.paddingRight = sbw + 'px';

            document.body.style.top = -lockedY + 'px';
            document.body.classList.add('is-locked');
        }
    }

    function unlockScroll() {
        if (lockCount > 0 && --lockCount === 0) {
            document.body.classList.remove('is-locked');
            document.body.style.top = '';
            document.body.style.paddingRight = '';
            jumpTo(lockedY);
            scrollLocked = false;
        }
    }


    /* ======================================================================
       2. i18n DICTIONARY
       ====================================================================== */

    var I18N = {
        ru: {
            a11y_skip: 'Перейти к содержимому',

            nav_about: 'О нас',
            nav_services: 'Услуги',
            nav_gallery: 'Галерея',
            nav_faq: 'Вопросы',
            nav_contacts: 'Контакты',

            hero_badge: 'Играем с 2021 года',
            hero_desc: 'Профессиональные теннисные корты с покрытием Hard и премиальным сервисом.',
            btn_book: 'Забронировать',

            stat_since: 'Год открытия',
            stat_years: 'Лет на корте',
            stat_surface: 'Покрытие кортов',
            stat_months: 'Месяцев с климат-контролем',

            about_badge: 'Международные стандарты',
            about_title: 'Комплекс, созданный для игры',
            about_p1: 'Meridian Tennis — современный теннисный комплекс, созданный для профессионалов и любителей. Мы работаем с 2021 года и предлагаем идеальные условия для тренировок и активного отдыха. Наши корты полностью соответствуют международным стандартам, обеспечивая комфортную игру в любое время года.',
            about_p2: 'Для удобства гостей у нас есть аренда теннисного инвентаря, видеонаблюдение для родителей, мини-бар, раздевалки и ежемесячные турниры.',
            about_f1: 'Аренда инвентаря',
            about_f2: 'Видеонаблюдение для родителей',
            about_f3: 'Мини-бар',
            about_f4: 'Раздевалки',
            about_f5: 'Ежемесячные турниры',

            services_title: 'Всё для комфортной игры',
            services_sub: 'От аренды ракетки до турнира — мы закрываем каждый вопрос, чтобы вы думали только об игре.',
            service_1_title: 'Теннисные турниры',
            service_1_desc: 'Для разных возрастов и уровней подготовки — от начинающих до опытных игроков.',
            service_2_title: 'Аренда инвентаря',
            service_2_desc: 'Ракетки, мячи и всё необходимое для комфортных тренировок и игр.',
            service_3_title: 'Кондиционированные корты',
            service_3_desc: 'Поддерживается комфортная температура в любое время года.',
            service_4_title: 'Видеонаблюдение',
            service_4_desc: 'Родители могут спокойно наблюдать за тренировкой ребёнка.',
            service_5_title: 'Мини-бар',
            service_5_desc: 'Напитки и лёгкие закуски, чтобы восстановиться между сетами.',
            service_6_title: 'Раздевалки',
            service_6_desc: 'Чистые раздевалки, чтобы вы приходили и уходили налегке.',

            process_kicker: 'Бронирование',
            process_title: 'Три шага до игры',
            step_1_title: 'Оставьте заявку',
            step_1_desc: 'Позвоните нам или заполните форму — это займёт меньше минуты.',
            step_2_title: 'Подтвердим время',
            step_2_desc: 'Свяжемся с вами, подберём свободный корт и удобный слот.',
            step_3_title: 'Приходите играть',
            step_3_desc: 'Инвентарь, раздевалка и климат-контроль уже ждут вас на месте.',

            court_plan_title: 'Схема теннисного корта',
            court_plan_caption: 'Hard · 23,77 × 10,97 м · международный стандарт ITF',
            court_l_alley: 'Коридор',
            court_l_service: 'Зона подачи',
            court_l_net: 'Сетка',
            court_l_baseline: 'Задняя линия',

            gallery_title: 'Как это выглядит',
            gallery_sub: 'Нажмите на фотографию, чтобы открыть её в полном размере.',
            gallery_alt: 'Теннисный корт — вид',

            faq_kicker: 'Вопросы и ответы',
            faq_title: 'Частые вопросы',
            faq_q1: 'Нужно ли приходить со своей ракеткой?',
            faq_a1: 'Нет. У нас работает аренда инвентаря: ракетки, мячи и всё необходимое для тренировки или матча.',
            faq_q2: 'Можно ли играть летом и зимой?',
            faq_a2: 'Да. Корты кондиционированы, поэтому комфортная температура поддерживается круглый год.',
            faq_q3: 'Подходит ли комплекс для детей и новичков?',
            faq_a3: 'Да. Наши турниры проходят для разных возрастов и уровней подготовки — от начинающих до опытных игроков. Для родителей есть видеонаблюдение.',
            faq_q4: 'Какое покрытие на кортах?',
            faq_a4: 'Покрытие Hard. Корты соответствуют международным стандартам.',
            faq_q5: 'Как забронировать корт?',
            faq_a5: 'Позвоните по номеру +998 99 801 99 66 или оставьте заявку в форме ниже — мы свяжемся с вами и подтвердим время.',

            contact_title: 'Забронируйте корт',
            contact_sub: 'Оставьте заявку — перезвоним и подберём удобное время.',
            form_addr_label: 'Адрес',
            form_phone_label: 'Телефон',
            hours_label: 'Часы работы',
            hours_value: 'Ежедневно — уточняйте по телефону',

            form_name: 'Имя',
            form_phone: 'Номер телефона',
            form_email: 'Email',
            form_date: 'Желаемая дата',
            form_time: 'Время',
            form_message: 'Сообщение',

            btn_send: 'Отправить',
            btn_sending: 'Отправка…',
            btn_success: 'Отправлено',
            btn_error: 'Ошибка',
            status_ok: 'Спасибо! Мы получили заявку и свяжемся с вами в ближайшее время.',
            status_err: 'Не удалось отправить. Позвоните нам: +998 99 801 99 66',

            err_name: 'Укажите имя (минимум 2 буквы)',
            err_phone: 'Введите корректный номер телефона',
            err_email: 'Введите корректный email',
            err_msg: 'Напишите короткое сообщение',

            footer_tagline: 'Профессиональные теннисные корты с покрытием Hard и премиальным сервисом.',
            footer_nav: 'Разделы',
            footer_contacts: 'Связаться',
            footer_map: 'Мы на карте',
            footer_rights: 'Все права защищены.',

            aria_theme: 'Переключить тему',
            aria_menu_open: 'Открыть меню',
            aria_menu_close: 'Закрыть меню',
            aria_top: 'Наверх',
            aria_lb_close: 'Закрыть',
            aria_lb_prev: 'Предыдущее фото',
            aria_lb_next: 'Следующее фото',
            a11y_scroll: 'Прокрутить вниз'
        },

        uz: {
            a11y_skip: 'Asosiy qismga o‘tish',

            nav_about: 'Biz haqimizda',
            nav_services: 'Xizmatlar',
            nav_gallery: 'Galereya',
            nav_faq: 'Savollar',
            nav_contacts: 'Aloqa',

            hero_badge: '2021-yildan beri o‘ynaymiz',
            hero_desc: 'Hard qoplamali va premium servisga ega professional tennis kortlari.',
            btn_book: 'Band qilish',

            stat_since: 'Ochilgan yil',
            stat_years: 'Yil kortda',
            stat_surface: 'Kort qoplamasi',
            stat_months: 'Oy iqlim nazorati bilan',

            about_badge: 'Xalqaro standartlar',
            about_title: 'O‘yin uchun yaratilgan majmua',
            about_p1: 'Meridian Tennis — professionallar va havaskorlar uchun mo‘ljallangan zamonaviy tennis majmuasi. Biz 2021-yildan beri ishlaymiz va mashg‘ulotlar hamda faol dam olish uchun ideal sharoitlarni taklif etamiz. Kortlarimiz xalqaro standartlarga to‘liq mos keladi va yilning istalgan vaqtida qulay o‘yinni ta’minlaydi.',
            about_p2: 'Mehmonlar qulayligi uchun bizda inventar ijarasi, ota-onalar uchun kuzatuv kameralari, mini-bar, yechinish xonalari va oylik turnirlar mavjud.',
            about_f1: 'Inventar ijarasi',
            about_f2: 'Ota-onalar uchun kuzatuv kameralari',
            about_f3: 'Mini-bar',
            about_f4: 'Yechinish xonalari',
            about_f5: 'Oylik turnirlar',

            services_title: 'Qulay o‘yin uchun barchasi',
            services_sub: 'Raketka ijarasidan turnirgacha — barcha masalani biz hal qilamiz, siz faqat o‘yin haqida o‘ylang.',
            service_1_title: 'Tennis turnirlari',
            service_1_desc: 'Turli yosh va tayyorgarlik darajalari uchun — yangi boshlovchilardan tajribali o‘yinchilargacha.',
            service_2_title: 'Inventar ijarasi',
            service_2_desc: 'Raketkalar, to‘plar va qulay mashg‘ulotlar uchun barcha zarur jihozlar.',
            service_3_title: 'Konditsionerli kortlar',
            service_3_desc: 'Yilning istalgan vaqtida qulay harorat saqlanadi.',
            service_4_title: 'Videokuzatuv',
            service_4_desc: 'Ota-onalar farzandi mashg‘ulotini bemalol kuzatib turishi mumkin.',
            service_5_title: 'Mini-bar',
            service_5_desc: 'Setlar orasida tiklanish uchun ichimliklar va yengil gazaklar.',
            service_6_title: 'Yechinish xonalari',
            service_6_desc: 'Toza yechinish xonalari — yengil kelib, yengil ketasiz.',

            process_kicker: 'Band qilish',
            process_title: 'O‘yingacha uch qadam',
            step_1_title: 'Ariza qoldiring',
            step_1_desc: 'Bizga qo‘ng‘iroq qiling yoki shaklni to‘ldiring — bir daqiqadan ham kam vaqt oladi.',
            step_2_title: 'Vaqtni tasdiqlaymiz',
            step_2_desc: 'Siz bilan bog‘lanamiz, bo‘sh kort va qulay vaqtni tanlaymiz.',
            step_3_title: 'O‘ynagani keling',
            step_3_desc: 'Inventar, yechinish xonasi va iqlim nazorati sizni joyida kutmoqda.',

            court_plan_title: 'Tennis korti sxemasi',
            court_plan_caption: 'Hard · 23,77 × 10,97 m · ITF xalqaro standarti',
            court_l_alley: 'Yo‘lak',
            court_l_service: 'Servis maydoni',
            court_l_net: 'To‘r',
            court_l_baseline: 'Orqa chiziq',

            gallery_title: 'Bu qanday ko‘rinadi',
            gallery_sub: 'Suratni to‘liq hajmda ochish uchun ustiga bosing.',
            gallery_alt: 'Tennis korti — ko‘rinish',

            faq_kicker: 'Savol-javob',
            faq_title: 'Ko‘p beriladigan savollar',
            faq_q1: 'O‘z raketkam bilan kelishim kerakmi?',
            faq_a1: 'Yo‘q. Bizda inventar ijarasi mavjud: raketkalar, to‘plar va mashg‘ulot yoki o‘yin uchun kerakli barcha jihozlar.',
            faq_q2: 'Yozda va qishda o‘ynash mumkinmi?',
            faq_a2: 'Ha. Kortlar konditsionerlangan, shuning uchun qulay harorat yil davomida saqlanadi.',
            faq_q3: 'Majmua bolalar va yangi boshlovchilarga mosmi?',
            faq_a3: 'Ha. Turnirlarimiz turli yosh va tayyorgarlik darajalari uchun o‘tkaziladi. Ota-onalar uchun videokuzatuv mavjud.',
            faq_q4: 'Kortlarda qanday qoplama?',
            faq_a4: 'Hard qoplama. Kortlar xalqaro standartlarga mos keladi.',
            faq_q5: 'Kortni qanday band qilish mumkin?',
            faq_a5: '+998 99 801 99 66 raqamiga qo‘ng‘iroq qiling yoki quyidagi shakl orqali ariza qoldiring — biz siz bilan bog‘lanamiz.',

            contact_title: 'Kortni band qiling',
            contact_sub: 'Ariza qoldiring — qayta qo‘ng‘iroq qilib, qulay vaqtni tanlaymiz.',
            form_addr_label: 'Manzil',
            form_phone_label: 'Telefon',
            hours_label: 'Ish vaqti',
            hours_value: 'Har kuni — telefon orqali aniqlashtiring',

            form_name: 'Ism',
            form_phone: 'Telefon raqami',
            form_email: 'Email',
            form_date: 'Istalgan sana',
            form_time: 'Vaqt',
            form_message: 'Xabar',

            btn_send: 'Yuborish',
            btn_sending: 'Yuborilmoqda…',
            btn_success: 'Yuborildi',
            btn_error: 'Xatolik',
            status_ok: 'Rahmat! Arizangizni oldik va tez orada siz bilan bog‘lanamiz.',
            status_err: 'Yuborib bo‘lmadi. Bizga qo‘ng‘iroq qiling: +998 99 801 99 66',

            err_name: 'Ismingizni kiriting (kamida 2 harf)',
            err_phone: 'To‘g‘ri telefon raqamini kiriting',
            err_email: 'To‘g‘ri email kiriting',
            err_msg: 'Qisqa xabar yozing',

            footer_tagline: 'Hard qoplamali va premium servisga ega professional tennis kortlari.',
            footer_nav: 'Bo‘limlar',
            footer_contacts: 'Bog‘lanish',
            footer_map: 'Xaritada',
            footer_rights: 'Barcha huquqlar himoyalangan.',

            aria_theme: 'Mavzuni almashtirish',
            aria_menu_open: 'Menyuni ochish',
            aria_menu_close: 'Menyuni yopish',
            aria_top: 'Yuqoriga',
            aria_lb_close: 'Yopish',
            aria_lb_prev: 'Oldingi surat',
            aria_lb_next: 'Keyingi surat',
            a11y_scroll: 'Pastga aylantirish'
        },

        en: {
            a11y_skip: 'Skip to content',

            nav_about: 'About',
            nav_services: 'Services',
            nav_gallery: 'Gallery',
            nav_faq: 'FAQ',
            nav_contacts: 'Contact',

            hero_badge: 'Playing since 2021',
            hero_desc: 'Professional hard-court tennis with premium service.',
            btn_book: 'Book a court',

            stat_since: 'Year opened',
            stat_years: 'Years on court',
            stat_surface: 'Court surface',
            stat_months: 'Months of climate control',

            about_badge: 'International standards',
            about_title: 'A complex built for the game',
            about_p1: 'Meridian Tennis is a modern tennis complex designed for professionals and amateurs alike. Operating since 2021, we offer perfect conditions for training and active recreation. Our courts fully meet international standards, so the game stays comfortable all year round.',
            about_p2: 'For our guests we provide equipment rental, video monitoring for parents, a mini-bar, locker rooms and monthly tournaments.',
            about_f1: 'Equipment rental',
            about_f2: 'Video monitoring for parents',
            about_f3: 'Mini-bar',
            about_f4: 'Locker rooms',
            about_f5: 'Monthly tournaments',

            services_title: 'Everything a good match needs',
            services_sub: 'From renting a racket to running a tournament — we handle the details so you only think about the game.',
            service_1_title: 'Tennis tournaments',
            service_1_desc: 'For all ages and skill levels — from beginners to experienced players.',
            service_2_title: 'Equipment rental',
            service_2_desc: 'Rackets, balls and everything you need for a comfortable session.',
            service_3_title: 'Air-conditioned courts',
            service_3_desc: 'A comfortable temperature is maintained throughout the year.',
            service_4_title: 'Video monitoring',
            service_4_desc: 'Parents can watch their child train with complete peace of mind.',
            service_5_title: 'Mini-bar',
            service_5_desc: 'Drinks and light snacks to recover between sets.',
            service_6_title: 'Locker rooms',
            service_6_desc: 'Clean locker rooms so you can arrive and leave light.',

            process_kicker: 'Booking',
            process_title: 'Three steps to play',
            step_1_title: 'Send a request',
            step_1_desc: 'Call us or fill in the form — it takes less than a minute.',
            step_2_title: 'We confirm the slot',
            step_2_desc: 'We get in touch, find a free court and a time that suits you.',
            step_3_title: 'Come and play',
            step_3_desc: 'Equipment, locker room and climate control are ready when you arrive.',

            court_plan_title: 'Tennis court diagram',
            court_plan_caption: 'Hard · 23.77 × 10.97 m · ITF international standard',
            court_l_alley: 'Doubles alley',
            court_l_service: 'Service box',
            court_l_net: 'Net',
            court_l_baseline: 'Baseline',

            gallery_title: 'See it for yourself',
            gallery_sub: 'Tap a photo to open it full size.',
            gallery_alt: 'Tennis court — view',

            faq_kicker: 'Questions & answers',
            faq_title: 'Frequently asked questions',
            faq_q1: 'Do I need to bring my own racket?',
            faq_a1: 'No. We rent equipment: rackets, balls and everything else you need for a session or a match.',
            faq_q2: 'Can I play in summer and winter?',
            faq_a2: 'Yes. The courts are air-conditioned, so a comfortable temperature is kept all year round.',
            faq_q3: 'Is the complex suitable for children and beginners?',
            faq_a3: 'Yes. Our tournaments run for different ages and skill levels — from beginners to experienced players. Video monitoring is available for parents.',
            faq_q4: 'What is the court surface?',
            faq_a4: 'Hard court. The courts meet international standards.',
            faq_q5: 'How do I book a court?',
            faq_a5: 'Call +998 99 801 99 66 or send a request through the form below — we will contact you and confirm the time.',

            contact_title: 'Book your court',
            contact_sub: 'Send a request — we will call back and find a time that works.',
            form_addr_label: 'Address',
            form_phone_label: 'Phone',
            hours_label: 'Opening hours',
            hours_value: 'Daily — please confirm by phone',

            form_name: 'Name',
            form_phone: 'Phone number',
            form_email: 'Email',
            form_date: 'Preferred date',
            form_time: 'Time',
            form_message: 'Message',

            btn_send: 'Send',
            btn_sending: 'Sending…',
            btn_success: 'Sent',
            btn_error: 'Error',
            status_ok: 'Thank you! We received your request and will be in touch shortly.',
            status_err: 'Could not send. Please call us: +998 99 801 99 66',

            err_name: 'Enter your name (at least 2 letters)',
            err_phone: 'Enter a valid phone number',
            err_email: 'Enter a valid email address',
            err_msg: 'Write a short message',

            footer_tagline: 'Professional hard-court tennis with premium service.',
            footer_nav: 'Sections',
            footer_contacts: 'Get in touch',
            footer_map: 'Find us on the map',
            footer_rights: 'All rights reserved.',

            aria_theme: 'Toggle theme',
            aria_menu_open: 'Open menu',
            aria_menu_close: 'Close menu',
            aria_top: 'Back to top',
            aria_lb_close: 'Close',
            aria_lb_prev: 'Previous photo',
            aria_lb_next: 'Next photo',
            a11y_scroll: 'Scroll down'
        }
    };


    /* ======================================================================
       3. i18n ENGINE
       ====================================================================== */

    var lang = (function () {
        var saved = store.get('mt-lang');
        if (saved && I18N[saved]) return saved;
        var nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
        return I18N[nav] ? nav : 'ru';
    })();

    function t(key) {
        var pack = I18N[lang] || I18N.ru;
        return pack[key] !== undefined ? pack[key] : (I18N.ru[key] !== undefined ? I18N.ru[key] : key);
    }

    /**
     * Applies the active dictionary.
     * `data-i18n`      → textContent
     * `data-i18n-attr` → "attr:key" pairs separated by ";" (e.g. "aria-label:aria_top")
     */
    function applyTranslations() {
        document.documentElement.setAttribute('lang', lang);

        $$('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var pack = I18N[lang];
            if (pack && pack[key] !== undefined) el.textContent = pack[key];
        });

        $$('[data-i18n-attr]').forEach(function (el) {
            el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
                var bits = pair.split(':');
                if (bits.length !== 2) return;
                el.setAttribute(bits[0].trim(), t(bits[1].trim()));
            });
        });

        // Accessible names that live only in attributes.
        $$('.shot img').forEach(function (img, i) {
            img.alt = t('gallery_alt') + ' ' + (i + 1);
        });

        var themeBtn = $('#themeToggle');
        if (themeBtn) {
            themeBtn.setAttribute('aria-label', t('aria_theme'));
            themeBtn.setAttribute('title', t('aria_theme'));
        }

        var burger = $('#menuToggle');
        if (burger) {
            var open = burger.getAttribute('aria-expanded') === 'true';
            burger.setAttribute('aria-label', t(open ? 'aria_menu_close' : 'aria_menu_open'));
        }

        var top = $('#toTop');
        if (top) {
            top.setAttribute('aria-label', t('aria_top'));
            top.setAttribute('title', t('aria_top'));
        }

        var map = { '#lbClose': 'aria_lb_close', '#lbPrev': 'aria_lb_prev', '#lbNext': 'aria_lb_next' };
        Object.keys(map).forEach(function (sel) {
            var el = $(sel);
            if (el) el.setAttribute('aria-label', t(map[sel]));
        });

        // The submit button keeps its state label while busy.
        var submit = $('#submitBtn');
        if (submit && !submit.disabled) {
            var label = $('.btn__label', submit);
            if (label) label.textContent = t('btn_send');
        }
    }

    function setLang(next) {
        if (!I18N[next] || next === lang) return;
        lang = next;
        store.set('mt-lang', next);
        applyTranslations();

        $$('.lang__btn').forEach(function (btn) {
            var on = btn.getAttribute('data-lang') === next;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', String(on));
        });
    }

    function initLang() {
        $$('.lang__btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setLang(btn.getAttribute('data-lang'));
            });
        });

        // Sync buttons with the resolved language, then paint.
        $$('.lang__btn').forEach(function (btn) {
            var on = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', String(on));
        });
        applyTranslations();
    }


    /* ======================================================================
       4. THEME
       ====================================================================== */

    function initTheme() {
        var root = document.documentElement;
        var btn = $('#themeToggle');
        var media = window.matchMedia('(prefers-color-scheme: dark)');

        function paint(theme) {
            root.setAttribute('data-theme', theme);
            if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));

            // Keep the browser UI colour in step with the page.
            $$('meta[name="theme-color"]').forEach(function (m) { m.remove(); });
            var meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = theme === 'dark' ? '#08110D' : '#F8FAF9';
            document.head.appendChild(meta);
        }

        paint(root.getAttribute('data-theme') || 'light');

        if (btn) {
            btn.addEventListener('click', function () {
                var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                store.set('mt-theme', next);
                paint(next);
            });
        }

        // Follow the OS only while the user has not made an explicit choice.
        var onSystemChange = function (e) {
            if (!store.get('mt-theme')) paint(e.matches ? 'dark' : 'light');
        };
        if (media.addEventListener) media.addEventListener('change', onSystemChange);
        else if (media.addListener) media.addListener(onSystemChange);
    }


    /* ======================================================================
       5. HEADER: SCROLL STATE, PROGRESS, SCROLLSPY
       ====================================================================== */

    function initScrollUI() {
        var header = $('#header');
        var progress = $('#scrollProgress');
        var toTop = $('#toTop');
        var links = $$('.nav__link');

        var sections = links
            .map(function (a) {
                var id = a.getAttribute('href');
                return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
            })
            .filter(Boolean);

        /* Geometry is measured once per resize rather than per frame.
           Reading getBoundingClientRect()/offsetHeight inside the scroll
           handler forces a synchronous layout on every single frame, which
           is what makes long pages feel like they stutter. */
        var tops = [];
        var headerH = 0;
        var docH = 0;
        var lastActive = null;

        function measure() {
            var y = window.scrollY || window.pageYOffset;
            headerH = header ? header.offsetHeight : 0;
            docH = document.documentElement.scrollHeight - window.innerHeight;
            tops = sections.map(function (s) {
                return s.getBoundingClientRect().top + y;
            });
        }

        var onScroll = rafThrottle(function () {
            /* While the body is pinned the document has no scrollable
               height, so the browser reports y = 0. Acting on that would
               drop the header shadow and rewind the progress bar for as
               long as the drawer or the lightbox is open. */
            if (scrollLocked) return;

            var y = window.scrollY || window.pageYOffset;

            if (header) header.classList.toggle('is-scrolled', y > 20);
            if (toTop) toTop.classList.toggle('is-visible', y > 600);
            if (progress) {
                progress.style.transform = 'scaleX(' + (docH > 0 ? Math.min(y / docH, 1) : 0) + ')';
            }

            // Scrollspy — the last section whose top has crossed the header.
            var line = y + headerH + 24;
            var active = null;
            for (var i = 0; i < tops.length; i++) {
                if (tops[i] <= line) active = sections[i];
            }
            // Snap to the last link once the page is scrolled to the bottom.
            if (docH > 0 && y >= docH - 4 && sections.length) active = sections[sections.length - 1];

            if (active !== lastActive) {
                lastActive = active;
                links.forEach(function (a) {
                    a.classList.toggle('is-active', !!active && a.getAttribute('href') === '#' + active.id);
                });
            }
        });

        // Same reason as onScroll: measuring a pinned body reads a
        // collapsed scrollHeight and poisons docH for the whole session.
        var onResize = rafThrottle(function () {
            if (scrollLocked) return;
            measure();
            onScroll();
        });

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        // Late-loading images change the page height, so re-measure then too.
        window.addEventListener('load', onResize);

        measure();
        onScroll();

        if (toTop) {
            toTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            });
        }
    }


    /* ======================================================================
       6. MOBILE NAVIGATION
       ====================================================================== */

    function initNav() {
        var burger = $('#menuToggle');
        var nav = $('#mainNav');
        var backdrop = $('#navBackdrop');
        if (!burger || !nav) return;

        var isOpen = false;

        function setOpen(open) {
            if (open === isOpen) return;
            isOpen = open;

            nav.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', t(open ? 'aria_menu_close' : 'aria_menu_open'));

            if (backdrop) {
                if (open) {
                    backdrop.hidden = false;
                    requestAnimationFrame(function () { backdrop.classList.add('is-visible'); });
                } else {
                    backdrop.classList.remove('is-visible');
                    setTimeout(function () { if (!isOpen) backdrop.hidden = true; }, 320);
                }
            }

            if (open) {
                lockScroll();
                var first = $(FOCUSABLE, nav);
                if (first) first.focus();
            } else {
                unlockScroll();
                burger.focus();
            }
        }

        burger.addEventListener('click', function () { setOpen(!isOpen); });
        if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });

        // Closing on link click is what makes an in-page drawer usable.
        $$('.nav__link', nav).forEach(function (a) {
            a.addEventListener('click', function () { setOpen(false); });
        });

        document.addEventListener('keydown', function (e) {
            if (!isOpen) return;
            if (e.key === 'Escape') setOpen(false);
            else if (e.key === 'Tab') trapFocus(nav, e);
        });

        // Reset when the drawer breakpoint is left behind.
        var desktop = window.matchMedia('(min-width: 981px)');
        var onChange = function (e) { if (e.matches) setOpen(false); };
        if (desktop.addEventListener) desktop.addEventListener('change', onChange);
        else if (desktop.addListener) desktop.addListener(onChange);
    }


    /* ======================================================================
       7. REVEAL ON SCROLL
       ====================================================================== */

    function initReveal() {
        var items = $$('.reveal');
        if (!items.length) return;

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        items.forEach(function (el) { io.observe(el); });
    }


    /* ======================================================================
       8. COUNTERS
       ====================================================================== */

    function initCounters() {
        // "Years on court" is derived, never hard-coded, so it can't go stale.
        var years = $('#yearsCounter');
        if (years) {
            var value = Math.max(1, new Date().getFullYear() - 2021);
            years.setAttribute('data-count-to', String(value));
            years.textContent = '0';
        }

        var counters = $$('.counter');
        if (!counters.length) return;

        function run(el) {
            var target = parseInt(el.getAttribute('data-count-to'), 10);
            if (isNaN(target)) return;

            if (prefersReducedMotion) {
                el.textContent = String(target);
                return;
            }

            var duration = 1400;
            var start = null;

            function frame(now) {
                if (start === null) start = now;
                var p = Math.min((now - start) / duration, 1);
                var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
                el.textContent = String(Math.round(target * eased));
                if (p < 1) requestAnimationFrame(frame);
                else el.textContent = String(target);
            }

            requestAnimationFrame(frame);
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(run);
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                run(entry.target);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        counters.forEach(function (el) {
            el.textContent = '0';
            io.observe(el);
        });
    }


    /* ======================================================================
       9. FAQ ACCORDION
       ====================================================================== */

    function initFaq() {
        var buttons = $$('.faq__q');
        if (!buttons.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var panel = document.getElementById(btn.getAttribute('aria-controls'));
                var item = btn.closest('.faq__item');
                var willOpen = btn.getAttribute('aria-expanded') !== 'true';

                // Single-open accordion.
                buttons.forEach(function (other) {
                    if (other === btn) return;
                    other.setAttribute('aria-expanded', 'false');
                    var p = document.getElementById(other.getAttribute('aria-controls'));
                    if (p) p.hidden = true;
                    var i = other.closest('.faq__item');
                    if (i) i.classList.remove('is-open');
                });

                btn.setAttribute('aria-expanded', String(willOpen));
                if (panel) panel.hidden = !willOpen;
                if (item) item.classList.toggle('is-open', willOpen);
            });
        });
    }


    /* ======================================================================
       10. GALLERY LIGHTBOX
       ====================================================================== */

    function initLightbox() {
        var shots = $$('.shot');
        var box = $('#lightbox');
        var img = $('#lbImg');
        var counter = $('#lbCounter');
        var btnClose = $('#lbClose');
        var btnPrev = $('#lbPrev');
        var btnNext = $('#lbNext');
        if (!shots.length || !box || !img) return;

        /* Resolved lazily, not cached at init: with <picture>, currentSrc is
           only known once the browser has picked a source, and these images
           are lazy-loaded.

           The grid is served through srcset, so currentSrc is a tile-sized
           variant — far too small for a full-screen view. Prefer the explicit
           full-size file, picking the format the browser already proved it
           supports by what it chose for the thumbnail. */
        function sourceAt(i) {
            var el = shots[i] ? shots[i].querySelector('img') : null;
            if (!el) return { src: '', alt: '' };
            var thumb = el.currentSrc || el.src || '';
            var full = /\.webp(\?|$)/i.test(thumb)
                ? el.getAttribute('data-full-webp')
                : el.getAttribute('data-full-jpg');
            return { src: full || thumb, alt: el.alt };
        }

        var count = shots.length;

        var index = 0;
        var lastFocused = null;
        var closeTimer = null;

        /* Prefetching costs two extra full-size photos — 300–600 KB — every
           time a picture is opened. That is a fair trade on a desktop
           connection and a bad one on a phone, where the tap that opens the
           lightbox is often the first thing done on a cellular link. */
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        var prefetchNeighbours = window.matchMedia('(min-width: 761px)').matches &&
            !(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));

        function show(i) {
            index = (i + count) % count;
            var item = sourceAt(index);
            img.src = item.src;
            img.alt = item.alt;
            if (counter) counter.textContent = (index + 1) + ' / ' + count;

            if (!prefetchNeighbours) return;

            // Warm the neighbours so arrow navigation feels instant.
            [index + 1, index - 1].forEach(function (n) {
                var near = sourceAt((n + count) % count);
                if (near.src) { var pre = new Image(); pre.src = near.src; }
            });
        }

        function open(i) {
            // Cancel a still-pending close so a fast re-open isn't hidden by it.
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            lastFocused = document.activeElement;
            box.hidden = false;
            show(i);
            requestAnimationFrame(function () { box.classList.add('is-open'); });
            lockScroll();
            if (btnClose) btnClose.focus();
        }

        function close() {
            if (box.hidden) return;
            box.classList.remove('is-open');
            unlockScroll();
            closeTimer = setTimeout(function () {
                closeTimer = null;
                box.hidden = true;
                img.removeAttribute('src');
            }, 320);
            if (lastFocused && lastFocused.focus) lastFocused.focus();
        }

        shots.forEach(function (shot, i) {
            shot.addEventListener('click', function () { open(i); });
        });

        if (btnClose) btnClose.addEventListener('click', close);
        if (btnPrev) btnPrev.addEventListener('click', function () { show(index - 1); });
        if (btnNext) btnNext.addEventListener('click', function () { show(index + 1); });

        // Click on the dimmed area (but not on the photo or controls) closes.
        box.addEventListener('click', function (e) {
            if (e.target === box || e.target.classList.contains('lightbox__figure')) close();
        });

        document.addEventListener('keydown', function (e) {
            if (box.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') show(index + 1);
            else if (e.key === 'ArrowLeft') show(index - 1);
            else if (e.key === 'Tab') trapFocus(box, e);
        });

        // Touch swipe.
        var startX = 0;
        var startY = 0;
        box.addEventListener('touchstart', function (e) {
            startX = e.changedTouches[0].clientX;
            startY = e.changedTouches[0].clientY;
        }, { passive: true });

        box.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - startX;
            var dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
        }, { passive: true });
    }


    /* ======================================================================
       11. CONTACT FORM
       ====================================================================== */

    function initForm() {
        var form = $('#contactForm');
        var btn = $('#submitBtn');
        var status = $('#formStatus');
        if (!form || !btn) return;

        var label = $('.btn__label', btn);
        var fields = {
            name: $('#f-name'),
            phone: $('#f-phone'),
            email: $('#f-email'),
            message: $('#f-msg')
        };

        var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

        // Built at runtime: a \p{L} literal is a *parse* error on engines without
        // Unicode property escapes, which would take the whole file down.
        var NAME_RE;
        try {
            NAME_RE = new RegExp("^[\\p{L}][\\p{L}\\s'’-]{1,}$", 'u');
        } catch (e) {
            NAME_RE = /^[^\d\s][^\d]{1,}$/;
        }

        var rules = {
            name: function (v) { return NAME_RE.test(v.trim()); },
            phone: function (v) {
                var digits = v.replace(/\D/g, '');
                return digits.length >= 9 && digits.length <= 15;
            },
            email: function (v) { return EMAIL_RE.test(v.trim()); },
            message: function (v) { return v.trim().length >= 5; }
        };

        var errorKeys = {
            name: 'err_name',
            phone: 'err_phone',
            email: 'err_email',
            message: 'err_msg'
        };

        function setFieldState(key, valid) {
            var input = fields[key];
            if (!input) return valid;

            var wrap = input.closest('.field');
            var err = wrap ? wrap.querySelector('.field__err') : null;

            if (wrap) wrap.classList.toggle('is-invalid', !valid);
            if (input.setAttribute) input.setAttribute('aria-invalid', String(!valid));
            if (err) err.textContent = valid ? '' : t(errorKeys[key]);
            return valid;
        }

        function validate(key) {
            var input = fields[key];
            if (!input) return true;
            return setFieldState(key, rules[key](input.value));
        }

        // Validate on blur; once a field is marked bad, correct it live.
        Object.keys(fields).forEach(function (key) {
            var input = fields[key];
            if (!input) return;

            input.addEventListener('blur', function () {
                if (input.value.trim()) validate(key);
            });

            input.addEventListener('input', function () {
                var wrap = input.closest('.field');
                if (wrap && wrap.classList.contains('is-invalid')) validate(key);
            });
        });

        /* --- Phone: keep only a leading "+" and digits, group as +998 XX XXX XX XX --- */
        if (fields.phone) {
            fields.phone.addEventListener('input', function () {
                var el = fields.phone;
                var atEnd = el.selectionStart === el.value.length;
                var raw = el.value.replace(/[^\d+]/g, '');

                if (raw.indexOf('+') > 0) raw = raw.replace(/\+/g, '');
                else raw = raw.charAt(0) + raw.slice(1).replace(/\+/g, '');

                var digits = raw.replace(/\D/g, '');
                var out;

                if (digits.indexOf('998') === 0 && digits.length > 3) {
                    var rest = digits.slice(3, 12);
                    var groups = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 7), rest.slice(7, 9)]
                        .filter(Boolean);
                    out = '+998' + (groups.length ? ' ' + groups.join(' ') : '');
                } else {
                    out = (raw.charAt(0) === '+' ? '+' : '') + digits;
                }

                el.value = out;
                // Only restore the caret to the end — mid-string edits keep native behaviour.
                if (atEnd) el.setSelectionRange(out.length, out.length);
            });

            fields.phone.addEventListener('focus', function () {
                if (!fields.phone.value) fields.phone.value = '+998 ';
            });

            fields.phone.addEventListener('blur', function () {
                if (fields.phone.value.replace(/\D/g, '') === '998') fields.phone.value = '';
            });
        }

        /* --- Date picker: no bookings in the past --- */
        var dateInput = $('#f-date');
        if (dateInput) {
            var today = new Date();
            var iso = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');
            dateInput.min = iso;
        }

        /* ---------- delivery ---------- */

        function escapeHtml(v) {
            return String(v == null || v === '' ? '—' : v)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        /** Builds the Telegram message (parse_mode: HTML). */
        function buildMessage(data) {
            var when = [data.get('date'), data.get('time')].filter(Boolean).join(' ');
            var lines = [
                '🎾 <b>Новая заявка — Meridian Tennis</b>',
                '',
                '👤 <b>Имя:</b> ' + escapeHtml(data.get('name')),
                '📞 <b>Телефон:</b> ' + escapeHtml(data.get('phone')),
                '✉️ <b>Email:</b> ' + escapeHtml(data.get('email'))
            ];
            if (when) lines.push('🗓 <b>Желаемое время:</b> ' + escapeHtml(when));
            lines.push('', '💬 <b>Сообщение:</b>', escapeHtml(data.get('message')));
            lines.push('', '<i>Язык сайта: ' + lang.toUpperCase() + '</i>');
            return lines.join('\n');
        }

        /** Returns a promise, or null when Telegram isn't configured yet. */
        function sendToTelegram(data, signal) {
            var tg = CONFIG.telegram;
            var url;

            if (tg.proxyUrl) {
                url = tg.proxyUrl;
            } else if (tg.botToken && tg.chatId) {
                url = 'https://api.telegram.org/bot' + tg.botToken + '/sendMessage';
            } else {
                return null;
            }

            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: tg.chatId,
                    text: buildMessage(data),
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }),
                signal: signal
            }).then(function (res) {
                if (!res.ok) throw new Error('Telegram HTTP ' + res.status);
                return 'telegram';
            });
        }

        function setBtnState(state) {
            btn.classList.remove('is-loading', 'is-success', 'is-error');
            if (state) btn.classList.add('is-' + state);
        }

        function reset() {
            btn.disabled = false;
            btn.removeAttribute('aria-busy');
            setBtnState(null);
            if (label) label.textContent = t('btn_send');
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Honeypot: a filled hidden field means a bot. Fail silently.
            var trap = form.querySelector('[name="_gotcha"]');
            if (trap && trap.value) return;

            var firstBad = null;
            Object.keys(fields).forEach(function (key) {
                if (!validate(key) && !firstBad) firstBad = fields[key];
            });

            if (firstBad) {
                firstBad.focus();
                if (status) {
                    status.textContent = '';
                    status.className = 'form__status';
                }
                return;
            }

            var data = new FormData(form);
            data.append('lang', lang);
            data.append('page', location.href);

            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true');
            setBtnState('loading');
            if (label) label.textContent = t('btn_sending');
            if (status) {
                status.textContent = '';
                status.className = 'form__status';
            }

            // Abort a hung request instead of leaving the button spinning forever.
            var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            var signal = controller ? controller.signal : undefined;
            var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

            var request = sendToTelegram(data, signal);

            if (!request) {
                if (window.console) {
                    console.error('[meridian] Telegram не настроен — заполните ' +
                        'CONFIG.telegram в script.js (см. README.md).');
                }
                request = Promise.reject(new Error('Telegram is not configured'));
            }

            request.then(function () {
                setBtnState('success');
                if (label) label.textContent = t('btn_success');
                if (status) {
                    status.textContent = t('status_ok');
                    status.className = 'form__status is-ok';
                }

                form.reset();
                $$('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); });
                $$('.field__err', form).forEach(function (f) { f.textContent = ''; });
            }, function (err) {
                if (window.console) console.error('[meridian] доставка:', err);
                setBtnState('error');
                if (label) label.textContent = t('btn_error');
                if (status) {
                    status.textContent = t('status_err');
                    status.className = 'form__status is-err';
                }
            }).then(function () {
                if (timer) clearTimeout(timer);
                setTimeout(reset, 4000);
            });
        });
    }


    /* ======================================================================
       12. MISC
       ====================================================================== */

    function initMisc() {
        var year = $('#year');
        if (year) year.textContent = String(new Date().getFullYear());

        /* The skip link is keyboard-only, but on a phone it could end up
           holding focus — via the keyboard accessory bar, an external
           keyboard, or an assistive gesture — and then sit pinned over the
           header as a green pill for the rest of the visit. Scrolling or
           touching the page is unambiguous proof the user is not tabbing
           through it, so hand focus back. */
        var skip = $('.skip-link');
        if (skip) {
            var dismissSkip = function () {
                if (document.activeElement === skip) skip.blur();
            };
            window.addEventListener('scroll', dismissSkip, { passive: true });
            window.addEventListener('touchstart', dismissSkip, { passive: true });
        }

        // Move focus to the anchor target so keyboard users follow the jump.
        $$('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function () {
                var id = a.getAttribute('href');
                if (!id || id === '#') return;
                var target = document.querySelector(id);
                if (!target) return;
                setTimeout(function () {
                    target.setAttribute('tabindex', '-1');
                    target.focus({ preventScroll: true });
                }, 420);
            });
        });
    }


    /* ======================================================================
       BOOTSTRAP
       ====================================================================== */

    function init() {
        [initLang, initTheme, initScrollUI, initNav, initReveal,
            initCounters, initFaq, initLightbox, initForm, initMisc]
            .forEach(function (fn) {
                try {
                    fn();
                } catch (err) {
                    // One broken module must never take the whole page down.
                    if (window.console) console.error('[meridian] ' + fn.name + ':', err);
                }
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
