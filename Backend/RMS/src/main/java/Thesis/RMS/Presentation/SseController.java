package Thesis.RMS.Presentation;

import Thesis.RMS.Application.DTO.OrderDTO;
import Thesis.RMS.Application.DTO.ReservationDTO;
import Thesis.RMS.Application.DTO.ReservationResponseDTO;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/v1/sse")
public class SseController {
    private final List<SseEmitter> orderEmitters = new CopyOnWriteArrayList<>();
    private final List<SseEmitter> reservationEmitters = new CopyOnWriteArrayList<>();



    //Orders
    @GetMapping(path = "/orders", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter orderEvents() {
        System.out.println("New SSE connection established for orders");
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.orderEmitters.add(emitter);

        emitter.onCompletion(() -> this.orderEmitters.remove(emitter));
        emitter.onTimeout(() -> this.orderEmitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connection")
                    .data("connected")
                    .id("init"));
        } catch (Exception e) {
            System.out.println("Failed to send initial SSE event: " + e.getMessage());
            emitter.complete();
            orderEmitters.remove(emitter);
        }

        return emitter;
    }

    public void sendOrderEvent(String eventType, OrderDTO order) {
        for (SseEmitter emitter : orderEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("order-event")
                        .data(order)
                        .id(eventType)
                        .reconnectTime(30000));
            } catch (Exception e) {
                emitter.complete();
                orderEmitters.remove(emitter);
            }
        }
    }


    //Reservations

    @GetMapping(path = "/reservations", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter reservationEvents() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.reservationEmitters.add(emitter);

        emitter.onCompletion(() -> this.reservationEmitters.remove(emitter));
        emitter.onTimeout(() -> this.reservationEmitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connection")
                    .data("connected")
                    .id("init"));
        } catch (Exception e) {
            System.out.println("Failed to send initial SSE event: " + e.getMessage());
            emitter.complete();
            reservationEmitters.remove(emitter);
        }

        return emitter;
    }

    public void sendReservationEvent(String eventType, ReservationResponseDTO reservation) {
        if (reservation == null) {
            System.out.println("Attempted to send null reservation event");
            return;
        }

        for (SseEmitter emitter : reservationEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("reservation-event")
                        .data(reservation)
                        .id(eventType)
                        .reconnectTime(30000));
                System.out.println("Sent reservation event: " + eventType + " for reservation " + reservation.getId());
            } catch (Exception e) {
                System.out.println("Failed to send reservation event: " + e.getMessage());
                emitter.complete();
                reservationEmitters.remove(emitter);
            }
        }
    }

}