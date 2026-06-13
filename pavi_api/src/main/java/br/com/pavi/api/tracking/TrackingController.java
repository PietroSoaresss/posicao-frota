package br.com.pavi.api.tracking;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/tracking")
public class TrackingController {

    private final TrackingQueryService queryService;
    private final TrackingSyncService syncService;

    public TrackingController(TrackingQueryService queryService, TrackingSyncService syncService) {
        this.queryService = queryService;
        this.syncService = syncService;
    }

    @GetMapping("/active-trips")
    public List<TrackingTripResponse> activeTrips() {
        return queryService.activeTrips();
    }

    @GetMapping("/vehicles/{plate}/latest")
    public TrackingPositionResponse latestPosition(@PathVariable String plate) {
        return queryService.latestPosition(plate).orElse(null);
    }

    @GetMapping("/vehicles/{plate}/trail")
    public List<TrackingPositionResponse> trail(@PathVariable String plate,
                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return queryService.trail(plate, from, to);
    }

    @PostMapping("/sync")
    public TrackingSyncResult sync() {
        return syncService.syncNow();
    }

    @GetMapping("/status")
    public TrackingStatusResponse status() {
        return syncService.status();
    }
}
