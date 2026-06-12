package br.com.pavi.api.tracking;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

@Component
public class SascarClient implements SascarPositionClient {

    private static final Logger log = LoggerFactory.getLogger(SascarClient.class);
    private static final TypeReference<List<SascarPositionPayload>> POSITION_LIST_TYPE = new TypeReference<>() {};

    private final RestClient restClient;
    private final SascarProperties properties;
    private final ObjectMapper objectMapper;

    public SascarClient(RestClient.Builder restClientBuilder,
                        SascarProperties properties,
                        ObjectMapper objectMapper) {
        this.restClient = restClientBuilder.build();
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<SascarPositionPayload> fetchLatestPositions() {
        if (properties.getUser().isBlank() || properties.getPassword().isBlank()) {
            throw new IllegalStateException("Sascar credentials are not configured");
        }

        String envelope = buildEnvelope(
                properties.getUser(),
                properties.getPassword(),
                properties.getPositionQuantity()
        );

        try {
            String response = restClient.post()
                    .uri(properties.getWsUrl())
                    .contentType(MediaType.TEXT_XML)
                    .header("SOAPAction", "http://webservice.web.integracao.sascar.com.br/getPositionPacketWithLicensePlateJSON")
                    .body(envelope)
                    .retrieve()
                    .body(String.class);

            try {
                return parsePositionPackets(response == null ? "" : response, objectMapper);
            } catch (Exception e) {
                log.error("Failed to parse Sascar response. First 500 chars: {}", 
                    response != null ? response.substring(0, Math.min(response.length(), 500)) : "null");
                throw e;
            }
        } catch (HttpClientErrorException e) {
            log.error("Sascar API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("Error calling Sascar API: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * The SASINTEGRA XSD defines this operation with English parameter names
     * (user/password/quantity); Portuguese names bind as null on the server and
     * produce a "null - exception" SOAP fault.
     */
    static String buildEnvelope(String user, String password, int quantity) {
        return """
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://webservice.web.integracao.sascar.com.br/">
                  <soapenv:Header/>
                  <soapenv:Body>
                    <web:getPositionPacketWithLicensePlateJSON>
                      <user>%s</user>
                      <password>%s</password>
                      <quantity>%d</quantity>
                    </web:getPositionPacketWithLicensePlateJSON>
                  </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(escapeXml(user), escapeXml(password), quantity);
    }

    static List<SascarPositionPayload> parsePositionPackets(String soapEnvelope, ObjectMapper objectMapper) {
        List<String> returnValues = extractReturnValues(soapEnvelope);
        if (returnValues.isEmpty()) {
            return List.of();
        }

        // Each <return> element carries a single JSON object (one packet);
        // ACCEPT_SINGLE_VALUE_AS_ARRAY also tolerates a JSON array inside one element.
        ObjectReader reader = objectMapper.copy()
                .findAndRegisterModules()
                .enable(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
                .readerFor(POSITION_LIST_TYPE);

        List<SascarPositionPayload> packets = new ArrayList<>();
        for (String json : returnValues) {
            if (json == null || json.isBlank()) {
                continue;
            }
            try {
                packets.addAll(reader.readValue(json));
            } catch (IOException e) {
                throw new IllegalArgumentException("Could not parse Sascar position JSON", e);
            }
        }
        return packets;
    }

    private static List<String> extractReturnValues(String soapEnvelope) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            Document document = factory.newDocumentBuilder()
                    .parse(new InputSource(new StringReader(soapEnvelope)));

            var returns = document.getElementsByTagNameNS("*", "return");
            if (returns.getLength() == 0) {
                returns = document.getElementsByTagName("return");
            }

            List<String> values = new ArrayList<>();
            for (int i = 0; i < returns.getLength(); i++) {
                values.add(returns.item(i).getTextContent());
            }
            return values;
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not parse Sascar SOAP envelope", e);
        }
    }

    private static String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
