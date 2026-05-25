package com.example.sawaskills.service;

import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import com.example.sawaskills.dto.volunteer.VolunteerSessionRequest;
import com.example.sawaskills.dto.volunteer.VolunteerSessionResponse;
import com.example.sawaskills.util.MinorUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VolunteerService {

    private final VolunteerSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final VolunteerParticipantRepository participantRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final ParentApprovalService parentApprovalService;

    public List<VolunteerSessionResponse> getAllSessions(String email) {
        Long userId = email != null ? userRepository.findByEmail(email).map(User::getId).orElse(null) : null;
        return sessionRepository.findAll().stream()
                .filter(s -> "APPROVED".equals(s.getStatus()))
                .map(s -> toResponse(s, userId))
                .collect(Collectors.toList());
    }

    public List<VolunteerSessionResponse> getMySessions(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return sessionRepository.findAll().stream()
                .filter(s -> s.getOrganizer() != null && s.getOrganizer().getId().equals(user.getId()))
                .map(s -> toResponse(s, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public VolunteerSessionResponse createSession(String email, VolunteerSessionRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdult = verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "ADULT")
                .map(req -> "APPROVED".equals(req.getStatus())).orElse(false);
        boolean isVolunteer = verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "VOLUNTEER")
                .map(req -> "APPROVED".equals(req.getStatus())).orElse(false);

        if (!isAdult && !isVolunteer) {
            throw new RuntimeException("You must be an Adult or a Volunteer to create a session");
        }

        // --- Validate title ---
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("Session name is required");
        }
        if (request.getTitle().length() > 100) {
            throw new RuntimeException("Session name must be 100 characters or fewer");
        }
        if (request.getDescription() != null && request.getDescription().length() > 500) {
            throw new RuntimeException("Description must be 500 characters or fewer");
        }

        // --- Parse and validate date ---
        LocalDateTime date;
        try {
            String raw = request.getSessionDate();
            if (raw == null || raw.isBlank()) {
                throw new RuntimeException("Session date is required");
            }
            // Accept full ISO datetime ("2025-06-15T15:30:00") or date-only ("2025-06-15")
            date = raw.contains("T") ? LocalDateTime.parse(raw) : LocalDate.parse(raw).atStartOfDay();
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Please use ISO-8601 (e.g. 2025-06-15T15:30:00)");
        }
        if (!date.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Session date must be in the future");
        }

        // --- Validate location ---
        String locationType = request.getLocationType() != null ? request.getLocationType().toUpperCase() : "REMOTE";
        if (!locationType.equals("REMOTE") && !locationType.equals("IN_PERSON")) {
            locationType = "REMOTE";
        }
        String location = null;
        if ("IN_PERSON".equals(locationType)) {
            if (request.getLocation() == null || request.getLocation().isBlank()) {
                throw new RuntimeException("Address is required for in-person sessions");
            }
            if (request.getLocation().trim().length() < 5) {
                throw new RuntimeException("Please provide a more specific address");
            }
            if (request.getLocation().length() > 255) {
                throw new RuntimeException("Address must be 255 characters or fewer");
            }
            location = request.getLocation().trim();
        }

        // Always create a group chat — every session must have one
        Conversation gc = Conversation.builder()
                .name(request.getTitle())
                .createdAt(LocalDateTime.now())
                .admin(user)
                .everyoneCanMessage(true)
                .participants(new HashSet<>(Collections.singletonList(user)))
                .build();
        gc = conversationRepository.save(gc);

        VolunteerSession session = VolunteerSession.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .sessionDate(date)
                .organizer(user)
                .groupChat(gc)
                .locationType(locationType)
                .location(location)
                .build();

        session = sessionRepository.save(session);
        return toResponse(session, user.getId());
    }

    @Transactional
    public void joinSession(String email, Long sessionId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        VolunteerSession session = sessionRepository.findById(sessionId).orElseThrow(() -> new RuntimeException("Session not found"));

        // Prevent session organizer from joining their own session
        if (session.getOrganizer() != null && session.getOrganizer().getId().equals(user.getId())) {
            throw new RuntimeException("You cannot join your own session");
        }

        if (participantRepository.existsBySessionIdAndParticipantId(sessionId, user.getId())) {
            throw new RuntimeException("You have already joined this session");
        }

        // Gate for minor users — require parental approval before joining
        if (MinorUtils.isMinor(user, verificationRequestRepository)) {
            String parentEmail = MinorUtils.parentEmail(user, verificationRequestRepository);
            User organizer = session.getOrganizer();
            String organizerInfo = organizer != null ? " · Organized by " + organizer.getName() + organizerPartyInfo(organizer) : "";
            String context = "Volunteer session: \"" + session.getTitle() + "\"" + organizerInfo;
            parentApprovalService.requestApproval(user, parentEmail, "SESSION_JOIN",
                    session.getId(), context, null);
            throw new RuntimeException("PENDING_PARENT_APPROVAL:We've sent an approval request to your parent's email. You'll be added once they approve.");
        }

        VolunteerParticipant p = VolunteerParticipant.builder()
                .session(session)
                .participant(user)
                .build();
        participantRepository.save(p);

        // Add to group chat — fetch fresh to ensure participants collection is initialized
        if (session.getGroupChat() != null) {
            Conversation gc = conversationRepository.findById(session.getGroupChat().getId())
                    .orElseThrow(() -> new RuntimeException("Group chat not found"));
            boolean alreadyMember = gc.getParticipants().stream()
                    .anyMatch(p2 -> p2.getId().equals(user.getId()));
            if (!alreadyMember) {
                gc.getParticipants().add(user);
                conversationRepository.save(gc);
            }
        }
    }

    private VolunteerSessionResponse toResponse(VolunteerSession session, Long currentUserId) {
        long participantCount = participantRepository.countBySessionId(session.getId());
        boolean isJoined = currentUserId != null &&
                participantRepository.existsBySessionIdAndParticipantId(session.getId(), currentUserId);
        boolean isOrganizer = currentUserId != null &&
                session.getOrganizer() != null &&
                session.getOrganizer().getId().equals(currentUserId);

        User org = session.getOrganizer();
        LocalDateTime sessionDate = session.getSessionDate();
        String dateStr = sessionDate != null ? sessionDate.toLocalDate().toString() : "TBD";
        String timeStr = sessionDate != null
                ? sessionDate.format(DateTimeFormatter.ofPattern("h:mm a"))
                : null;
        return VolunteerSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .description(session.getDescription())
                .date(dateStr)
                .time(timeStr)
                .organizer(org != null ? org.getName() : "Unknown")
                .status("upcoming")
                .participants((int)participantCount)
                .isJoined(isJoined)
                .isOrganizer(isOrganizer)
                .groupChatId(session.getGroupChat() != null ? session.getGroupChat().getId() : null)
                .organizerAge(org != null ? computeAge(org) : null)
                .organizerGender(org != null ? formatGender(org.getGender()) : null)
                .locationType(session.getLocationType())
                .location(session.getLocation())
                .build();
    }

    private Integer computeAge(User user) {
        LocalDate dob = user.getDob();
        if (dob == null) {
            for (String type : new String[]{"ADULT", "MINOR"}) {
                var opt = verificationRequestRepository
                        .findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), type)
                        .filter(r -> "APPROVED".equals(r.getStatus()))
                        .map(com.example.sawaskills.entity.VerificationRequest::getDob);
                if (opt.isPresent() && opt.get() != null) { dob = opt.get(); break; }
            }
        }
        return dob != null ? Period.between(dob, LocalDate.now()).getYears() : null;
    }

    private static String formatGender(String gender) {
        if (gender == null) return null;
        return switch (gender) {
            case "MALE" -> "Male";
            case "FEMALE" -> "Female";
            case "PREFER_NOT_TO_SAY" -> "Prefer not to say";
            default -> gender;
        };
    }

    private String organizerPartyInfo(User organizer) {
        StringBuilder sb = new StringBuilder();
        LocalDate dob = organizer.getDob();
        if (dob == null) {
            for (String type : new String[]{"ADULT", "MINOR"}) {
                var opt = verificationRequestRepository
                        .findTopByUserIdAndTypeOrderBySubmittedAtDesc(organizer.getId(), type)
                        .filter(r -> "APPROVED".equals(r.getStatus()))
                        .map(com.example.sawaskills.entity.VerificationRequest::getDob);
                if (opt.isPresent() && opt.get() != null) { dob = opt.get(); break; }
            }
        }
        if (dob != null) {
            int age = Period.between(dob, LocalDate.now()).getYears();
            sb.append(", Age: ").append(age);
        }
        String gender = formatGender(organizer.getGender());
        if (gender != null && !"Prefer not to say".equals(gender)) {
            sb.append(", Gender: ").append(gender);
        }
        return sb.toString();
    }
}
