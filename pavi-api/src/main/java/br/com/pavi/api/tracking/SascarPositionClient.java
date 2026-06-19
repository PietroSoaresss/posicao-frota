package br.com.pavi.api.tracking;

import java.util.List;

public interface SascarPositionClient {
    List<SascarPositionPayload> fetchLatestPositions();
}
