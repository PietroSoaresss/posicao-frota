package br.com.pavi.api.tracking;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;

/**
 * SASINTEGRA returns timestamps as "yyyy-MM-dd HH:mm:ss.S" (UTC, no offset),
 * which the default Instant deserialization rejects. ISO-8601 is also accepted.
 */
public class SascarInstantDeserializer extends JsonDeserializer<Instant> {

    private static final DateTimeFormatter SASCAR_FORMAT = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd HH:mm:ss")
            .optionalStart()
            .appendFraction(ChronoField.NANO_OF_SECOND, 0, 9, true)
            .optionalEnd()
            .toFormatter();

    @Override
    public Instant deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String text = parser.getText();
        if (text == null) {
            return null;
        }
        text = text.trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return null;
        }

        try {
            return Instant.parse(text);
        } catch (DateTimeParseException ignored) {
            // fall through to the Sascar format
        }

        try {
            return LocalDateTime.parse(text, SASCAR_FORMAT).toInstant(ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            throw new IOException("Unparseable Sascar timestamp: " + text, e);
        }
    }
}
