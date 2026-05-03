package com.example.sawaskills.config;

import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        List<SkillCategory> categories = seedCategories();
        seedSkills(categories);
    }

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

    private void seedSkills(List<SkillCategory> categories) {
        if (skillRepository.count() > 0) return;

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
        skillRepository.saveAll(skills);
    }
}
