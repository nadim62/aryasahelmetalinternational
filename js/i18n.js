/* ASMI language system (sample).
   English is the main language. On the first visit the page opens in the best match
   from the visitor's device language list (navigator.languages). A visitor's own choice
   in the switcher, or a shared link with ?lang=xx, always wins. Unknown languages get English.
   Nothing is sent anywhere; the choice is kept only if the visitor picks one. */
(() => {
  const L = {
    en: { name: 'English', t: ['Products', 'Route', 'How it works', 'Quality', 'FAQ', 'Menu', 'Request a quote', 'International steel trading', 'Prime and', 'non-prime steel.', 'International supply.', 'Arya Sahel Metal International supplies prime and non-prime steel for international trade. Start with the material, specification and quantity you need.', 'Offer your stock', 'Contact', 'Start with your specification.', 'Tell us what you need or share a stock offer. Prepare your enquiry below, email us directly, or call to discuss your requirements.', 'CALL ASMI', 'EMAIL ENQUIRIES', 'OFFICE ADDRESS', 'Language'] },
    ar: { name: 'العربية', rtl: 1, t: ['المنتجات', 'المسار', 'كيف نعمل', 'الجودة', 'الأسئلة الشائعة', 'القائمة', 'اطلب عرض سعر', 'تجارة الصلب الدولية', 'صلب من الدرجة الأولى', 'والدرجة الثانية.', 'توريد دولي.', 'تورّد Arya Sahel Metal International الصلب من الدرجة الأولى والثانية للتجارة الدولية. ابدأ بالمادة والمواصفات والكمية التي تحتاجها.', 'اعرض مخزونك', 'اتصل بنا', 'ابدأ بمواصفاتك.', 'أخبرنا بما تحتاجه أو شاركنا عرض مخزون. جهّز استفسارك أدناه، أو راسلنا مباشرة بالبريد الإلكتروني، أو اتصل لمناقشة متطلباتك.', 'اتصل بـ ASMI', 'الاستفسارات بالبريد', 'عنوان المكتب', 'اللغة'] },
    zh: { name: '中文', t: ['产品', '运输路线', '合作流程', '质量', '常见问题', '菜单', '获取报价', '国际钢材贸易', '一级品与', '二级品钢材。', '国际供应。', 'Arya Sahel Metal International 为国际贸易供应一级品和二级品钢材。请从您所需的材料、规格和数量开始。', '出售您的库存', '联系我们', '从您的规格开始。', '告诉我们您的需求，或向我们提供库存报价。您可以在下方填写询盘、直接发送电子邮件，或致电洽谈。', '致电 ASMI', '邮件询盘', '办公地址', '语言'] },
    es: { name: 'Español', t: ['Productos', 'Ruta', 'Cómo funciona', 'Calidad', 'Preguntas', 'Menú', 'Solicitar cotización', 'Comercio internacional de acero', 'Acero de primera', 'y de segunda.', 'Suministro internacional.', 'Arya Sahel Metal International suministra acero de primera y de segunda calidad para el comercio internacional. Empiece por el material, la especificación y la cantidad que necesita.', 'Ofrezca su stock', 'Contacto', 'Empiece por su especificación.', 'Díganos qué necesita o envíenos una oferta de stock. Prepare su consulta abajo, escríbanos por correo o llámenos para hablar de sus requisitos.', 'LLAME A ASMI', 'CONSULTAS POR CORREO', 'DIRECCIÓN DE LA OFICINA', 'Idioma'] },
    fr: { name: 'Français', t: ['Produits', 'Itinéraire', 'Fonctionnement', 'Qualité', 'FAQ', 'Menu', 'Demander un devis', 'Négoce international d’acier', 'Acier de premier', 'et de second choix.', 'Fourniture internationale.', 'Arya Sahel Metal International fournit de l’acier de premier et de second choix pour le commerce international. Commencez par le matériau, la spécification et la quantité dont vous avez besoin.', 'Proposer votre stock', 'Contact', 'Commencez par votre spécification.', 'Dites-nous ce dont vous avez besoin ou proposez-nous un stock. Préparez votre demande ci-dessous, écrivez-nous par e-mail ou appelez-nous pour en discuter.', 'APPELER ASMI', 'DEMANDES PAR E-MAIL', 'ADRESSE DU BUREAU', 'Langue'] },
    de: { name: 'Deutsch', t: ['Produkte', 'Route', 'Ablauf', 'Qualität', 'FAQ', 'Menü', 'Angebot anfragen', 'Internationaler Stahlhandel', 'Stahl in 1. Wahl', 'und 2. Wahl.', 'Internationale Lieferung.', 'Arya Sahel Metal International liefert Stahl in 1. Wahl und 2. Wahl für den internationalen Handel. Beginnen Sie mit Material, Spezifikation und Menge, die Sie benötigen.', 'Lagerbestand anbieten', 'Kontakt', 'Beginnen Sie mit Ihrer Spezifikation.', 'Sagen Sie uns, was Sie benötigen, oder bieten Sie uns Ihren Lagerbestand an. Bereiten Sie Ihre Anfrage unten vor, schreiben Sie uns eine E-Mail oder rufen Sie an.', 'ASMI ANRUFEN', 'ANFRAGEN PER E-MAIL', 'BÜROADRESSE', 'Sprache'] },
    pt: { name: 'Português', t: ['Produtos', 'Rota', 'Como funciona', 'Qualidade', 'Perguntas', 'Menu', 'Pedir cotação', 'Comércio internacional de aço', 'Aço de primeira', 'e de segunda linha.', 'Fornecimento internacional.', 'A Arya Sahel Metal International fornece aço de primeira e de segunda linha para o comércio internacional. Comece pelo material, pela especificação e pela quantidade de que precisa.', 'Ofereça o seu estoque', 'Contato', 'Comece pela sua especificação.', 'Diga-nos o que precisa ou envie uma oferta de estoque. Prepare o seu pedido abaixo, escreva-nos por e-mail ou ligue para conversar sobre os seus requisitos.', 'LIGAR PARA A ASMI', 'CONSULTAS POR E-MAIL', 'ENDEREÇO DO ESCRITÓRIO', 'Idioma'] },
    ru: { name: 'Русский', t: ['Продукция', 'Маршрут', 'Как мы работаем', 'Качество', 'Вопросы', 'Меню', 'Запросить цену', 'Международная торговля сталью', 'Сталь первого', 'и второго сорта.', 'Международные поставки.', 'Arya Sahel Metal International поставляет сталь первого и второго сорта для международной торговли. Начните с нужного материала, спецификации и количества.', 'Предложить свой склад', 'Контакты', 'Начните со спецификации.', 'Сообщите, что вам нужно, или предложите нам складской остаток. Подготовьте запрос ниже, напишите нам по электронной почте или позвоните.', 'ПОЗВОНИТЬ В ASMI', 'ЗАПРОСЫ ПО E-MAIL', 'АДРЕС ОФИСА', 'Язык'] },
    tr: { name: 'Türkçe', t: ['Ürünler', 'Rota', 'Nasıl çalışır', 'Kalite', 'SSS', 'Menü', 'Teklif isteyin', 'Uluslararası çelik ticareti', 'Birinci ve', 'ikinci kalite çelik.', 'Uluslararası tedarik.', 'Arya Sahel Metal International, uluslararası ticaret için birinci ve ikinci kalite çelik tedarik eder. İhtiyacınız olan malzeme, şartname ve miktarla başlayın.', 'Stoğunuzu teklif edin', 'İletişim', 'Şartnamenizle başlayın.', 'Neye ihtiyacınız olduğunu söyleyin veya stok teklifinizi paylaşın. Talebinizi aşağıda hazırlayın, bize e-posta gönderin veya arayın.', 'ASMI’Yİ ARAYIN', 'E-POSTA İLE TALEP', 'OFİS ADRESİ', 'Dil'] },
    hi: { name: 'हिन्दी', t: ['उत्पाद', 'मार्ग', 'प्रक्रिया', 'गुणवत्ता', 'सामान्य प्रश्न', 'मेनू', 'कोटेशन माँगें', 'अंतरराष्ट्रीय इस्पात व्यापार', 'प्राइम और', 'नॉन-प्राइम स्टील।', 'अंतरराष्ट्रीय आपूर्ति।', 'Arya Sahel Metal International अंतरराष्ट्रीय व्यापार के लिए प्राइम और नॉन-प्राइम स्टील की आपूर्ति करती है। अपनी ज़रूरत की सामग्री, स्पेसिफिकेशन और मात्रा से शुरुआत करें।', 'अपना स्टॉक ऑफ़र करें', 'संपर्क', 'अपने स्पेसिफिकेशन से शुरुआत करें।', 'हमें बताएँ कि आपको क्या चाहिए या अपना स्टॉक ऑफ़र भेजें। नीचे अपनी पूछताछ तैयार करें, हमें ईमेल करें या बात करने के लिए कॉल करें।', 'ASMI को कॉल करें', 'ईमेल पूछताछ', 'कार्यालय का पता', 'भाषा'] },
    bn: { name: 'বাংলা', t: ['পণ্য', 'রুট', 'কীভাবে কাজ করে', 'মান', 'সাধারণ প্রশ্ন', 'মেনু', 'কোটেশন চান', 'আন্তর্জাতিক ইস্পাত বাণিজ্য', 'প্রাইম ও', 'নন-প্রাইম স্টিল।', 'আন্তর্জাতিক সরবরাহ।', 'Arya Sahel Metal International আন্তর্জাতিক বাণিজ্যের জন্য প্রাইম ও নন-প্রাইম স্টিল সরবরাহ করে। আপনার প্রয়োজনীয় ম্যাটেরিয়াল, স্পেসিফিকেশন ও পরিমাণ দিয়ে শুরু করুন।', 'আপনার স্টক অফার করুন', 'যোগাযোগ', 'আপনার স্পেসিফিকেশন দিয়ে শুরু করুন।', 'আপনার কী প্রয়োজন তা জানান অথবা স্টক অফার পাঠান। নিচে আপনার এনকোয়ারি তৈরি করুন, সরাসরি ইমেইল করুন অথবা আলোচনার জন্য কল করুন।', 'ASMI-কে কল করুন', 'ইমেইল এনকোয়ারি', 'অফিসের ঠিকানা', 'ভাষা'] },
    ur: { name: 'اردو', rtl: 1, t: ['مصنوعات', 'روٹ', 'طریقۂ کار', 'معیار', 'عام سوالات', 'مینو', 'کوٹیشن طلب کریں', 'بین الاقوامی اسٹیل تجارت', 'پرائم اور', 'نان پرائم اسٹیل۔', 'بین الاقوامی فراہمی۔', 'Arya Sahel Metal International بین الاقوامی تجارت کے لیے پرائم اور نان پرائم اسٹیل فراہم کرتی ہے۔ اپنی مطلوبہ میٹریل، اسپیسیفکیشن اور مقدار سے آغاز کریں۔', 'اپنا اسٹاک پیش کریں', 'رابطہ', 'اپنی اسپیسیفکیشن سے آغاز کریں۔', 'ہمیں بتائیں کہ آپ کو کیا چاہیے یا اپنے اسٹاک کی پیشکش بھیجیں۔ نیچے اپنی انکوائری تیار کریں، ہمیں ای میل کریں یا بات کرنے کے لیے کال کریں۔', 'ASMI کو کال کریں', 'ای میل انکوائری', 'دفتر کا پتہ', 'زبان'] },
    id: { name: 'Bahasa Indonesia', t: ['Produk', 'Rute', 'Cara kerja', 'Kualitas', 'FAQ', 'Menu', 'Minta penawaran', 'Perdagangan baja internasional', 'Baja prime dan', 'non-prime.', 'Pasokan internasional.', 'Arya Sahel Metal International memasok baja prime dan non-prime untuk perdagangan internasional. Mulailah dengan material, spesifikasi, dan jumlah yang Anda butuhkan.', 'Tawarkan stok Anda', 'Kontak', 'Mulai dengan spesifikasi Anda.', 'Beri tahu kami kebutuhan Anda atau kirimkan penawaran stok. Siapkan permintaan Anda di bawah, kirim email langsung, atau telepon untuk berdiskusi.', 'HUBUNGI ASMI', 'PERMINTAAN VIA EMAIL', 'ALAMAT KANTOR', 'Bahasa'] },
    vi: { name: 'Tiếng Việt', t: ['Sản phẩm', 'Lộ trình', 'Quy trình', 'Chất lượng', 'Hỏi đáp', 'Menu', 'Yêu cầu báo giá', 'Thương mại thép quốc tế', 'Thép loại 1', 'và loại 2.', 'Cung ứng quốc tế.', 'Arya Sahel Metal International cung cấp thép loại 1 và loại 2 cho thương mại quốc tế. Hãy bắt đầu với vật liệu, quy cách và số lượng bạn cần.', 'Chào bán hàng tồn kho', 'Liên hệ', 'Bắt đầu với quy cách của bạn.', 'Cho chúng tôi biết bạn cần gì hoặc gửi chào bán hàng tồn kho. Soạn yêu cầu bên dưới, gửi email trực tiếp hoặc gọi điện để trao đổi.', 'GỌI ASMI', 'YÊU CẦU QUA EMAIL', 'ĐỊA CHỈ VĂN PHÒNG', 'Ngôn ngữ'] },
    it: { name: 'Italiano', t: ['Prodotti', 'Percorso', 'Come funziona', 'Qualità', 'FAQ', 'Menu', 'Richiedi un preventivo', 'Commercio internazionale di acciaio', 'Acciaio di prima', 'e seconda scelta.', 'Fornitura internazionale.', 'Arya Sahel Metal International fornisce acciaio di prima e seconda scelta per il commercio internazionale. Inizi dal materiale, dalla specifica e dalla quantità che le servono.', 'Offri il tuo stock', 'Contatti', 'Inizi dalla sua specifica.', 'Ci dica di cosa ha bisogno o ci invii un’offerta di stock. Prepari la richiesta qui sotto, ci scriva via e-mail o ci chiami per parlarne.', 'CHIAMA ASMI', 'RICHIESTE VIA E-MAIL', 'INDIRIZZO UFFICIO', 'Lingua'] },
    pl: { name: 'Polski', t: ['Produkty', 'Trasa', 'Jak działamy', 'Jakość', 'FAQ', 'Menu', 'Zapytaj o ofertę', 'Międzynarodowy handel stalą', 'Stal pierwszego', 'i drugiego gatunku.', 'Dostawy międzynarodowe.', 'Arya Sahel Metal International dostarcza stal pierwszego i drugiego gatunku dla handlu międzynarodowego. Zacznij od materiału, specyfikacji i ilości, których potrzebujesz.', 'Zaoferuj swój zapas', 'Kontakt', 'Zacznij od specyfikacji.', 'Napisz, czego potrzebujesz, lub prześlij ofertę zapasów. Przygotuj zapytanie poniżej, napisz do nas e-mail lub zadzwoń, aby omówić szczegóły.', 'ZADZWOŃ DO ASMI', 'ZAPYTANIA E-MAIL', 'ADRES BIURA', 'Język'] },
    fa: { name: 'فارسی', rtl: 1, t: ['محصولات', 'مسیر', 'روش کار', 'کیفیت', 'پرسش‌های متداول', 'منو', 'درخواست قیمت', 'تجارت بین‌المللی فولاد', 'فولاد درجه یک', 'و درجه دو.', 'تأمین بین‌المللی.', 'Arya Sahel Metal International فولاد درجه یک و درجه دو را برای تجارت بین‌المللی تأمین می‌کند. با متریال، مشخصات و مقدار مورد نیاز خود شروع کنید.', 'موجودی خود را عرضه کنید', 'تماس', 'با مشخصات خود شروع کنید.', 'به ما بگویید چه نیاز دارید یا پیشنهاد موجودی خود را بفرستید. استعلام خود را در پایین آماده کنید، مستقیم ایمیل بزنید یا برای گفت‌وگو تماس بگیرید.', 'تماس با ASMI', 'استعلام با ایمیل', 'نشانی دفتر', 'زبان'] },
    ja: { name: '日本語', t: ['製品', '輸送ルート', 'ご利用の流れ', '品質', 'よくある質問', 'メニュー', '見積もりを依頼', '国際鉄鋼貿易', '一級品と', '二級品の鋼材。', '国際供給。', 'Arya Sahel Metal International は、国際取引向けに一級品および二級品の鋼材を供給しています。必要な材料・仕様・数量からお知らせください。', '在庫を売りたい', 'お問い合わせ', 'まずは仕様をお知らせください。', 'ご希望の内容、または在庫のオファーをお知らせください。下のフォーム、メール、またはお電話でご相談いただけます。', 'ASMI に電話', 'メールでのお問い合わせ', 'オフィス所在地', '言語'] },
    ko: { name: '한국어', t: ['제품', '운송 경로', '진행 방식', '품질', '자주 묻는 질문', '메뉴', '견적 요청', '국제 철강 무역', '정품 및', '비정품 철강.', '국제 공급.', 'Arya Sahel Metal International은 국제 무역을 위한 정품 및 비정품(2급) 철강을 공급합니다. 필요한 소재, 규격, 수량부터 알려 주세요.', '재고 판매 제안', '문의', '규격부터 시작하세요.', '필요한 내용을 알려 주시거나 재고 오퍼를 보내 주세요. 아래에서 문의를 작성하거나, 이메일 또는 전화로 상담하실 수 있습니다.', 'ASMI 전화', '이메일 문의', '사무실 주소', '언어'] },
    nl: { name: 'Nederlands', t: ['Producten', 'Route', 'Werkwijze', 'Kwaliteit', 'FAQ', 'Menu', 'Offerte aanvragen', 'Internationale staalhandel', 'Staal 1e keus', 'en 2e keus.', 'Internationale levering.', 'Arya Sahel Metal International levert staal van eerste en tweede keus voor de internationale handel. Begin met het materiaal, de specificatie en de hoeveelheid die u nodig hebt.', 'Bied uw voorraad aan', 'Contact', 'Begin met uw specificatie.', 'Vertel ons wat u nodig hebt of deel een voorraadaanbod. Stel hieronder uw aanvraag op, mail ons rechtstreeks of bel om uw wensen te bespreken.', 'BEL ASMI', 'AANVRAGEN PER E-MAIL', 'KANTOORADRES', 'Taal'] }
  };
  const ORDER = ['en', 'ar', 'bn', 'zh', 'de', 'es', 'fa', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'tr', 'ur', 'vi'];
  const KEY = 'asmi-lang';

  // the elements, in the same order as each language's list above
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const menu = qa('#main-menu a');
  const facts = qa('.facts .mono');
  const targets = [
    menu[0], menu[1], menu[2], menu[3], menu[4],
    q('.menu-toggle'), null /* CTA: two buttons, handled below */, q('.hero .eyebrow'),
    null, null, null /* h1: three lines */, q('.hero .lead'), q('.hero .btn-ghost'),
    q('#contact .eyebrow'), q('#contact h2'), q('#contact .lead'), facts[0], facts[1], facts[2]
  ];
  const h1 = q('.hero h1'), ctas = qa('header .btn-heat, .hero .btn-heat');

  function pick() {
    const url = new URLSearchParams(location.search).get('lang');
    if (url && L[url.toLowerCase()]) return url.toLowerCase();               // shared link wins
    let saved = null; try { saved = localStorage.getItem(KEY); } catch (_) {}
    if (saved && L[saved]) return saved;                                      // visitor's own choice
    for (const tag of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])) {
      const base = String(tag).toLowerCase().split('-')[0];                   // es-MX → es, zh-Hant-TW → zh
      if (L[base]) return base;
    }
    return 'en';                                                              // anything else: English
  }

  function apply(code) {
    const d = L[code] || L.en, t = d.t;
    document.documentElement.lang = code;
    document.documentElement.dir = d.rtl ? 'rtl' : 'ltr';
    targets.forEach((el, i) => { if (el) el.textContent = t[i]; });
    ctas.forEach(el => { el.textContent = t[6]; });
    if (h1) { h1.textContent = ''; h1.append(t[8], document.createElement('br'), t[9], document.createElement('br')); const em = document.createElement('em'); em.textContent = t[10]; h1.append(em); }
    btn.querySelector('span').textContent = d.name;
    btn.setAttribute('aria-label', t[19] + ': ' + d.name);
    list.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.lang === code ? 'true' : 'false'));
    document.documentElement.classList.toggle('non-latin', !/^(en|de|es|fr|pt|it|nl|pl|tr|id|vi)$/.test(code));
  }

  // switcher in the header
  const box = document.createElement('div'); box.className = 'lang';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'lang-btn'; btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg><span></span>';
  const list = document.createElement('div'); list.className = 'lang-list'; list.hidden = true;
  ORDER.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.dataset.lang = c; b.lang = c; b.textContent = L[c].name; list.append(b); });
  box.append(btn, list);
  const toggle = q('.menu-toggle'); toggle.parentNode.insertBefore(box, toggle);
  const close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => { e.stopPropagation(); list.hidden = !list.hidden; btn.setAttribute('aria-expanded', String(!list.hidden)); });
  list.addEventListener('click', e => { const b = e.target.closest('button[data-lang]'); if (!b) return; try { localStorage.setItem(KEY, b.dataset.lang); } catch (_) {} apply(b.dataset.lang); close(); btn.focus(); });
  document.addEventListener('click', e => { if (!box.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  apply(pick());
  window.__asmiLang = { apply, pick, codes: ORDER };
})();
