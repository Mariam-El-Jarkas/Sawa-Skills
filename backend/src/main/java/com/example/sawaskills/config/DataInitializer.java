package com.example.sawaskills.config;

import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AuthProviderRepository authProviderRepository;
    private final SkillCategoryRepository skillCategoryRepository;
    private final SkillRepository skillRepository;
    private final ExchangeListingRepository exchangeListingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        List<SkillCategory> categories = seedCategories();
        List<Skill> skills = seedSkills(categories);
        List<User> demoUsers = seedDemoUsers();
        seedExchangeListings(demoUsers, skills);
        seedInitialSwaps(demoUsers);
    }

    // ── Admin user ────────────────────────────────────────────────────────────

    private void seedAdmin() {
        if (userRepository.existsByEmail("admin@sawa.com")) return;

        User admin = userRepository.save(User.builder()
                .name("Super Admin")
                .email("admin@sawa.com")
                .role("ADMIN")
                .verified(true)
                .createdAt(LocalDateTime.now())
                .build());

        authProviderRepository.save(AuthProvider.builder()
                .user(admin)
                .provider(AuthenticationProvider.LOCAL)
                .passwordHash(passwordEncoder.encode("admin123"))
                .createdAt(LocalDateTime.now())
                .build());

        System.out.println("[Sawa] Admin created: admin@sawa.com / admin123");
    }

    // ── Skill categories ──────────────────────────────────────────────────────

    private List<SkillCategory> seedCategories() {
        if (skillCategoryRepository.count() > 0) {
            return skillCategoryRepository.findAll();
        }

        List<SkillCategory> cats = List.of(
                SkillCategory.builder().name("Cooking").description("Culinary arts and cooking techniques").build(),
                SkillCategory.builder().name("Music").description("Musical instruments and theory").build(),
                SkillCategory.builder().name("Languages").description("Language learning and tutoring").build(),
                SkillCategory.builder().name("Tech").description("Technology, programming, and digital skills").build(),
                SkillCategory.builder().name("Art").description("Visual arts, drawing, and design").build(),
                SkillCategory.builder().name("Sports").description("Fitness, sports, and physical activities").build(),
                SkillCategory.builder().name("Business").description("Entrepreneurship and business skills").build(),
                SkillCategory.builder().name("Design").description("Graphic design and UI/UX").build()
        );
        return skillCategoryRepository.saveAll(cats);
    }

    // ── Skills ────────────────────────────────────────────────────────────────

    private List<Skill> seedSkills(List<SkillCategory> categories) {
        if (skillRepository.count() > 0) return skillRepository.findAll();

        Map<String, SkillCategory> catMap = new java.util.HashMap<>();
        categories.forEach(c -> catMap.put(c.getName(), c));

        List<Skill> skills = List.of(
                Skill.builder().skillName("Cooking").category(catMap.get("Cooking")).build(),
                Skill.builder().skillName("Baking").category(catMap.get("Cooking")).build(),
                Skill.builder().skillName("Guitar Lessons").category(catMap.get("Music")).build(),
                Skill.builder().skillName("Piano").category(catMap.get("Music")).build(),
                Skill.builder().skillName("Singing").category(catMap.get("Music")).build(),
                Skill.builder().skillName("Arabic Tutoring").category(catMap.get("Languages")).build(),
                Skill.builder().skillName("English Tutoring").category(catMap.get("Languages")).build(),
                Skill.builder().skillName("French").category(catMap.get("Languages")).build(),
                Skill.builder().skillName("Web Development").category(catMap.get("Tech")).build(),
                Skill.builder().skillName("React Native").category(catMap.get("Tech")).build(),
                Skill.builder().skillName("Python").category(catMap.get("Tech")).build(),
                Skill.builder().skillName("Photography").category(catMap.get("Art")).build(),
                Skill.builder().skillName("Drawing").category(catMap.get("Art")).build(),
                Skill.builder().skillName("Graphic Design").category(catMap.get("Design")).build(),
                Skill.builder().skillName("UI/UX Design").category(catMap.get("Design")).build(),
                Skill.builder().skillName("Digital Marketing").category(catMap.get("Business")).build(),
                Skill.builder().skillName("Yoga").category(catMap.get("Sports")).build(),
                Skill.builder().skillName("Football Coaching").category(catMap.get("Sports")).build()
        );
        return skillRepository.saveAll(skills);
    }

    // ── Demo users ────────────────────────────────────────────────────────────

    private List<User> seedDemoUsers() {
        List<String[]> demoData = List.of(
                new String[]{"Sarah M.", "sarah@demo.com", "I love cooking and teaching others!"},
                new String[]{"John D.", "john@demo.com", "Guitar teacher with 10 years experience."},
                new String[]{"Maya K.", "maya@demo.com", "Arabic tutor and language enthusiast."},
                new String[]{"David C.", "david@demo.com", "Full-stack developer looking to learn new skills."},
                new String[]{"Lara T.", "lara@demo.com", "Graphic designer and photography lover."}
        );

        return demoData.stream().map(d -> {
            if (userRepository.existsByEmail(d[1])) {
                return userRepository.findByEmail(d[1]).orElseThrow();
            }
            User user = userRepository.save(User.builder()
                    .name(d[0])
                    .email(d[1])
                    .bio(d[2])
                    .role("USER")
                    .verified(true)
                    .dob(LocalDate.of(1995, 1, 1))
                    .createdAt(LocalDateTime.now())
                    .build());

            authProviderRepository.save(AuthProvider.builder()
                    .user(user)
                    .provider(AuthenticationProvider.LOCAL)
                    .passwordHash(passwordEncoder.encode("demo123"))
                    .createdAt(LocalDateTime.now())
                    .build());

            return user;
        }).toList();
    }

    // ── Exchange listings ─────────────────────────────────────────────────────

    private void seedExchangeListings(List<User> users, List<Skill> skills) {
        if (exchangeListingRepository.count() > 0) return;
        if (users.isEmpty()) return;

        List<Object[]> listingData = List.of(
                new Object[]{users.get(0), "Cooking", "Guitar Lessons", "Beirut", "On-site"},
                new Object[]{users.get(1), "Guitar Lessons", "Arabic Tutoring", "Tripoli", "On-site"},
                new Object[]{users.get(2), "Arabic Tutoring", "Cooking", "Beirut", "On-site"},
                new Object[]{users.get(3), "Web Development", "Digital Marketing", "Online", "Remote"},
                new Object[]{users.get(4), "Photography", "UI/UX Design", "Beirut", "On-site"},
                new Object[]{users.size() > 1 ? users.get(1) : users.get(0), "Piano", "Web Development", "Beirut", "On-site"},
                new Object[]{users.size() > 2 ? users.get(2) : users.get(0), "French", "Graphic Design", "Beirut", "Remote"},
                new Object[]{users.size() > 3 ? users.get(3) : users.get(0), "Python", "Yoga", "Online", "Remote"}
        );

        listingData.forEach(d -> exchangeListingRepository.save(ExchangeListing.builder()
                .owner((User) d[0])
                .offeredSkill((String) d[1])
                .wantedSkill((String) d[2])
                .location((String) d[3])
                .availability((String) d[4])
                .createdAt(LocalDateTime.now())
                .active(true)
                .build()));

        System.out.println("[Sawa] Seeded " + listingData.size() + " exchange listings.");
    }

    private final SwapRequestRepository swapRequestRepository;

    private void seedInitialSwaps(List<User> users) {
        if (swapRequestRepository.count() > 0) return;
        if (users.size() < 4) return;

        User sarah = users.get(0); // sarah@demo.com
        User john = users.get(1);  // john@demo.com
        User maya = users.get(2);  // maya@demo.com
        User david = users.get(3); // david@demo.com

        // Sarah requested Guitar Lessons from John
        swapRequestRepository.save(SwapRequest.builder()
                .requester(sarah).receiver(john)
                .offeredSkill("Cooking").wantedSkill("Guitar Lessons")
                .status("PENDING")
                .createdAt(LocalDateTime.now().minusHours(2))
                .build());

        // Maya requested Cooking from Sarah
        swapRequestRepository.save(SwapRequest.builder()
                .requester(maya).receiver(sarah)
                .offeredSkill("Arabic Tutoring").wantedSkill("Cooking")
                .status("ACTIVE")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        // Sarah and David completed a swap
        swapRequestRepository.save(SwapRequest.builder()
                .requester(sarah).receiver(david)
                .offeredSkill("Cooking").wantedSkill("Web Development")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(5))
                .build());

        // Test Case: Sarah is the receiver (to see Accept/Reject buttons)
        User nour = users.stream().filter(u -> u.getEmail().equals("nour@demo.com")).findFirst().orElse(users.get(2));
        swapRequestRepository.save(SwapRequest.builder()
                .requester(nour).receiver(sarah)
                .offeredSkill("Graphic Design").wantedSkill("Cooking")
                .status("PENDING")
                .createdAt(LocalDateTime.now().minusMinutes(30))
                .build());

        System.out.println("[Sawa] Seeded initial swaps.");
    }
}
