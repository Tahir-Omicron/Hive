using NglApi.Models;

namespace NglApi.Services.Ai;

/// <summary>
/// Şablon əsaslı AI simulyatoru — real model DEYİL.
///
/// Məqsəd: AI axınını (mesaj → cavab → saxlama) tam işlək göstərmək və gələcəkdə
/// real modeli qoşmaq üçün yeri hazır saxlamaq. Cavablar personaya uyğun hazır
/// şablonlardan seçilir və istifadəçinin adı/mesajı ilə fərdiləşdirilir.
/// </summary>
public sealed class SimulatedAiResponder : IAiResponder
{
    public string Name => "simulated";

    private static readonly Dictionary<string, string[]> Templates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["study"] =
        [
            "Salam, {name}! «{topic}» mövzusunda kömək edə bilərəm. Tövsiyəm: mövzunu kiçik hissələrə böl və hər hissəni 25 dəqiqəlik bloklarda işlə, aralarda 5 dəqiqə fasilə ver.",
            "{name}, qeyd etdiyin «{topic}» üçün qısa plan: 1) əsas anlayışları yaz, 2) nümunə məsələ həll et, 3) özünə sual ver. Bu ardıcıllıq yadda saxlamağı gücləndirir.",
            "«{topic}» barədə düşünəndə əvvəlcə mövzunun ən çətin yerini müəyyən et. Vaxtın çoxunu məhz ora ayır — ən çox fayda oradan gəlir."
        ],
        ["career"] =
        [
            "Salam, {name}! Karyera ilə bağlı «{topic}» sualına qısa cavab: CV-ni bir səhifədə saxla və hər təcrübə üçün nəticə yaz (rəqəmlə).",
            "{name}, «{topic}» üçün praktik addım: həftədə bir şirkətə maraq məktubu yaz və LinkedIn profilini eyni mətnlə yenilə.",
            "Müsahibəyə hazırlaşarkən «{topic}» üzrə 3 real nümunə hazırla: problem, sənin rolun, nəticə. Bu format ən çox işləyəndir."
        ],
        ["campus"] =
        [
            "Salam, {name}! Kampus xəbərləri: «{topic}» ilə bağlı elanlar üçün universitet lövhələrini izləməyə davam et.",
            "{name}, «{topic}» barədə qısa xatırlatma: tədbirlərə qeydiyyat adətən bir həftə əvvəl bağlanır.",
            "Kampusda «{topic}» mövzusunda tələbə klubları var. İlk görüşə gedib baxmaq öhdəlik yaratmır — cəhd et."
        ],
        ["library"] =
        [
            "Salam, {name}! «{topic}» üçün mənbə axtarırsansa, əvvəlcə dərslik fəsillərinə, sonra elmi məqalələrə bax.",
            "{name}, «{topic}» üzrə qeyd aparmağın ən səmərəli yolu: hər mənbədən 3 əsas fikir yaz, qalanını atla.",
            "Kitabxanada «{topic}» üzrə sessiya planlaşdır: 2 saat oxu, 30 dəqiqə xülasə. Xülasə olmadan oxuma tez yaddan çıxır."
        ],
        ["language"] =
        [
            "Salam, {name}! «{topic}» mövzusunda dil praktikası üçün gündə 10 dəqiqə danışma məşqi et — səsi yazıb dinlə.",
            "{name}, «{topic}» üçün 20 yeni söz öyrənmək istəyirsənsə, onları cümlə içində öyrən, tək-tək yox.",
            "Dil öyrənməkdə ən böyük sıçrayış dinləmə+dəstəkdən gəlir: «{topic}» üzrə qısa videoya bax və mətnini oxu."
        ],
        ["math"] =
        [
            "Salam, {name}! «{topic}» üçün əvvəlcə tərifləri, sonra teoremləri sırayla yaz — qarışdırmaq ən çox səhvə səbəb olur.",
            "{name}, «{topic}» məsələsini həll edərkən hər addımı yaz. Nəticə səhv olsa da, addımlar harada dayandığını göstərir.",
            "Riyaziyyatda «{topic}» mövzusunu 10 məsələ ilə məşq et: 3 asan, 5 orta, 2 çətin. Bu nisbət balanslıdır."
        ],
        ["code"] =
        [
            "Salam, {name}! «{topic}» üzrə kod yazarkən əvvəlcə ən kiçik işləyən versiyanı yarat, sonra tədricən genişləndir.",
            "{name}, «{topic}» üçün xəta alsan, mesajı tam oxu — səbəb 90% halda ilk 3 sətirdə göstərilir.",
            "Kod keyfiyyəti üçün «{topic}» layihəsində funksiyaları kiçik saxla və adlarını aydın ver; şərh lazım olan yer çox vaxt işarədir ki, kod özü aydın deyil."
        ],
        ["erasmus"] =
        [
            "Salam, {name}! «{topic}» üzrə mübadilə proqramları üçün sənədləri ən azı 3 ay əvvəl hazırlamağa başla.",
            "{name}, «{topic}» üçün motivasiya məktubunu universitetə deyil, öz məqsədinə uyğun yaz.",
            "Mübadilə müraciətində «{topic}» üzrə dil sertifikatı çox vaxt ən uzun çəkən addımdır — onu ilk planlaşdır."
        ],
        ["sport"] =
        [
            "Salam, {name}! «{topic}» üçün həftədə 3 dəfə 30 dəqiqə kifayətdir — davamlılıq intensivlikdən vacibdir.",
            "{name}, «{topic}» mövzusunda klub seçərkən cədvəlinə uyğun olanı seç; uyğun olmayan cədvəl 2 həftəyə buraxılır.",
            "İdman + yuxu: «{topic}» üzrə nəticə görmək üçün yuxu rejimini də sabitləşdir."
        ],
        ["mind"] =
        [
            "Salam, {name}! «{topic}» barədə düşünürsənsə, hisslərini 5 dəqiqə yazıya tökmək qərar verməyi asanlaşdırır.",
            "{name}, «{topic}» üzrə narahatlıq hiss edəndə nəfəsə fokuslan: 4 saniyə al, 6 saniyə burax. Bir neçə dəfə təkrar et.",
            "«{topic}» mövzusunda özünə qarşı sərt olma — kiçik, davamlı addımlar ən yaxşı nəticə verir."
        ]
    };

    private static readonly string[] Fallback =
    [
        "Salam, {name}! Mesajını aldım: «{topic}». Bu barədə daha ətraflı yaza bilərsənmi — konkret nəyi bilmək istəyirsən?",
        "{name}, «{topic}» üzrə sualını aldım. Qısa cavab: mövzunu kiçik addımlara bölmək ən sürətli yoldur.",
        "Salam! «{topic}» barədə yazdıqlarını oxudum. Hansı hissədə çətinlik çəkdiyini yazsan, daha dəqiq kömək edə bilərəm."
    ];

    public Task<string> GenerateReplyAsync(
        User aiAccount, User user, string userMessage, CancellationToken cancellationToken = default)
    {
        var persona = (aiAccount.AiPersona ?? string.Empty).Trim();
        var bank = Templates.TryGetValue(persona, out var found) ? found : Fallback;

        var name = string.IsNullOrWhiteSpace(user.FirstName) ? user.Username : user.FirstName;
        var topic = Summarize(userMessage);

        // Deterministik seçim: eyni mesaja ardıcıl cavab sabit qalır (test üçün əlverişli),
        // amma müxtəlif mesajlar fərqli şablon alır.
        var index = Math.Abs(Hash(userMessage) % bank.Length);
        var reply = bank[index].Replace("{name}", name).Replace("{topic}", topic);

        return Task.FromResult(reply);
    }

    private static string Summarize(string message)
    {
        var clean = (message ?? string.Empty).Trim().Replace('\n', ' ').Replace('\r', ' ');
        if (clean.Length == 0) return "...";
        return clean.Length <= 60 ? clean : clean[..60] + "…";
    }

    private static int Hash(string value)
    {
        unchecked
        {
            var hash = 17;
            foreach (var c in value ?? string.Empty) hash = hash * 31 + c;
            return hash;
        }
    }
}
