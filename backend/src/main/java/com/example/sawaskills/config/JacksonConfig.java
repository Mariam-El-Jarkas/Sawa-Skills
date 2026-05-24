package com.example.sawaskills.config;

import com.fasterxml.jackson.core.StreamReadConstraints;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * Raise Jackson's max string length from the default 20 MB to 50 MB.
     * Required for base64-encoded document uploads (PDFs, DOCX, etc.)
     * sent as part of the JSON request body.
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonStringLengthCustomizer() {
        return builder -> builder.postConfigurer(mapper ->
            mapper.getFactory().setStreamReadConstraints(
                StreamReadConstraints.builder()
                    .maxStringLength(50_000_000) // 50 MB
                    .build()
            )
        );
    }
}
