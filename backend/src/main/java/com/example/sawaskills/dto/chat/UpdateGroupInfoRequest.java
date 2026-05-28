package com.example.sawaskills.dto.chat;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupInfoRequest {
    private String name;
    private String pictureBase64;
}
