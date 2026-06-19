package br.com.pavi.api.tracking;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SascarClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parsesRealSascarResponseWithMultipleReturnElements() {
        // Real response shape: one <return> per packet, each holding a single JSON
        // object (not an array), dates as "yyyy-MM-dd HH:mm:ss.S" and extra fields.
        String soap = """
                <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                  <S:Header/>
                  <S:Body>
                    <ns0:getPositionPacketWithLicensePlateJSONResponse xmlns:ns0="http://webservice.web.integracao.sascar.com.br/">
                      <return>{"vehicleId":2286106,"positionDateUtc":"2026-06-10 17:47:48.0","packetDateUtc":"2026-06-10 17:47:44.0","latitude":-25.9736048,"longitude":-50.5442784,"direction":0,"speed":0,"ignition":0,"odometer":12258,"state":"PR","city":"Sao Mateus do Sul","country":"BR","street":"Rod BR-476","rpm":0,"sequencingEvent":[],"events":[],"packetId":15206352127,"integratorId":51569,"driverId":null,"driverName":"null","licensePlate": "TRG1F82","accurateOdometer":12258.2}</return>
                      <return>{"vehicleId":1543201,"positionDateUtc":"2026-06-10 17:47:49.0","packetDateUtc":"2026-06-10 17:47:49.0","latitude":-27.3898243,"longitude":-52.2892391,"direction":151,"speed":0,"ignition":1,"odometer":581631,"state":"SC","city":"Campos Novos","country":"BR","street":"Rod BR-470","packetId":15206352119,"licensePlate":"JAG0E37"}</return>
                    </ns0:getPositionPacketWithLicensePlateJSONResponse>
                  </S:Body>
                </S:Envelope>
                """;

        List<SascarPositionPayload> packets = SascarClient.parsePositionPackets(soap, objectMapper);

        assertThat(packets).hasSize(2);

        SascarPositionPayload first = packets.getFirst();
        assertThat(first.vehicleId()).isEqualTo(2286106L);
        assertThat(first.licensePlate()).isEqualTo("TRG1F82");
        assertThat(first.packetId()).isEqualTo(15206352127L);
        assertThat(first.latitude()).isEqualTo(-25.9736048);
        assertThat(first.longitude()).isEqualTo(-50.5442784);
        assertThat(first.packetDateUtc()).isEqualTo(Instant.parse("2026-06-10T17:47:44Z"));
        assertThat(first.positionDateUtc()).isEqualTo(Instant.parse("2026-06-10T17:47:48Z"));

        SascarPositionPayload second = packets.get(1);
        assertThat(second.licensePlate()).isEqualTo("JAG0E37");
        assertThat(second.packetId()).isEqualTo(15206352119L);
    }

    @Test
    void parsesJsonArrayInsideSingleReturnElement() {
        String soap = """
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    <ns2:getPositionPacketWithLicensePlateJSONResponse xmlns:ns2="http://webservice.web.integracao.sascar.com.br/">
                      <return>[{"vehicleId":123,"licensePlate":"abc-1d23","latitude":-23.55,"longitude":-46.63,"speed":72,"ignition":1,"direction":180,"odometer":987654,"city":"Sao Paulo","state":"SP","street":"Av Paulista","packetDateUtc":"2026-06-09T12:34:56Z","positionDateUtc":"2026-06-09T12:34:50Z","packetId":456789}]</return>
                    </ns2:getPositionPacketWithLicensePlateJSONResponse>
                  </soap:Body>
                </soap:Envelope>
                """;

        List<SascarPositionPayload> packets = SascarClient.parsePositionPackets(soap, objectMapper);

        assertThat(packets).hasSize(1);
        SascarPositionPayload packet = packets.getFirst();
        assertThat(packet.vehicleId()).isEqualTo(123L);
        assertThat(packet.licensePlate()).isEqualTo("abc-1d23");
        assertThat(packet.packetId()).isEqualTo(456789L);
        assertThat(packet.latitude()).isEqualTo(-23.55);
        assertThat(packet.longitude()).isEqualTo(-46.63);
    }

    @Test
    void returnsEmptyListWhenResponseHasNoReturnElements() {
        String soap = """
                <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                  <S:Body>
                    <ns0:getPositionPacketWithLicensePlateJSONResponse xmlns:ns0="http://webservice.web.integracao.sascar.com.br/"/>
                  </S:Body>
                </S:Envelope>
                """;

        assertThat(SascarClient.parsePositionPackets(soap, objectMapper)).isEmpty();
    }

    @Test
    void buildsEnvelopeWithEnglishParameterNamesRequiredByWsdl() {
        // The SASINTEGRA XSD defines this operation with user/password/quantity;
        // Portuguese names (usuario/senha/quantidade) bind as null and the server
        // replies with a "null - exception" SOAP fault.
        String envelope = SascarClient.buildEnvelope("MAGISPAVI", "secret", 3000);

        assertThat(envelope).contains("<web:getPositionPacketWithLicensePlateJSON>");
        assertThat(envelope).contains("<user>MAGISPAVI</user>");
        assertThat(envelope).contains("<password>secret</password>");
        assertThat(envelope).contains("<quantity>3000</quantity>");
        assertThat(envelope).doesNotContain("<usuario>");
        assertThat(envelope).doesNotContain("<senha>");
        assertThat(envelope).doesNotContain("<quantidade>");
    }
}
