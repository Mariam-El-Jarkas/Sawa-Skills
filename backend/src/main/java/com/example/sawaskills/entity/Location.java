package com.example.sawaskills.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String city;

    private String region;

}