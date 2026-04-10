package com.example.sawaskills.controller;

import com.example.sawaskills.dto.volunteer.VolunteerSessionRequest;
import com.example.sawaskills.dto.volunteer.VolunteerSessionResponse;
import com.example.sawaskills.service.VolunteerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteer")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerService volunteerService;

    @GetMapping("/sessions")
    public ResponseEntity<List<VolunteerSessionResponse>> getAllSessions(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(volunteerService.getAllSessions(email));
    }

    @GetMapping("/my-sessions")
    public ResponseEntity<List<VolunteerSessionResponse>> getMySessions(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(volunteerService.getMySessions(userDetails.getUsername()));
    }

    @PostMapping("/sessions")
    public ResponseEntity<VolunteerSessionResponse> createSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody VolunteerSessionRequest request) {
        return ResponseEntity.ok(volunteerService.createSession(userDetails.getUsername(), request));
    }

    @PostMapping("/sessions/{id}/join")
    public ResponseEntity<Void> joinSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        volunteerService.joinSession(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }
}
