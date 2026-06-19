package br.com.pavi.api.service;

import br.com.pavi.api.model.Trip;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
public class FleetPositionScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(FleetPositionScheduler.class);
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");

    private final TripService tripService;

    public FleetPositionScheduler(TripService tripService) {
        this.tripService = tripService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void createTodayPositionOnStartup() {
        createTodayPosition("startup");
    }

    @Scheduled(cron = "0 1 0 * * *", zone = "America/Sao_Paulo")
    public void createTodayPositionAfterMidnight() {
        createTodayPosition("daily-schedule");
    }

    private void createTodayPosition(String trigger) {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        try {
            List<Trip> rows = tripService.createDailySnapshot(today);
            LOGGER.info("Fleet position snapshot checked for {} by {}. Rows available: {}", today, trigger, rows.size());
        } catch (IllegalArgumentException e) {
            LOGGER.info("Fleet position snapshot skipped for {} by {}: {}", today, trigger, e.getMessage());
        } catch (RuntimeException e) {
            LOGGER.error("Fleet position snapshot failed for {} by {}", today, trigger, e);
        }
    }
}
