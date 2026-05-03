package com.example.sawaskills.service;

import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import com.example.sawaskills.dto.volunteer.VolunteerSessionRequest;
import com.example.sawaskills.dto.volunteer.VolunteerSessionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    public List<VolunteerSessionResponse> getAllSessions(String email) {
        Long userId = email != null ? userRepository.findByEmail(email).map(User::getId).orElse(null) : null;
        return sessionRepository.findAll().stream()
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

        LocalDateTime date = LocalDateTime.now().plusDays(1);
        try {
            if (request.getSessionDate() != null && !request.getSessionDate().isEmpty()) {
                date = LocalDateTime.parse(request.getSessionDate() + "T00:00:00");
            }
        } catch (DateTimeParseException ignored) {}

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

        return VolunteerSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .description(session.getDescription())
                .date(session.getSessionDate() != null ? session.getSessionDate().toLocalDate().toString() : "TBD")
                .organizer(session.getOrganizer() != null ? session.getOrganizer().getName() : "Unknown")
                .status("upcoming")
                .participants((int)participantCount)
                .isJoined(isJoined)
                .isOrganizer(isOrganizer)
                .groupChatId(session.getGroupChat() != null ? session.getGroupChat().getId() : null)
                .build();
    }
}
