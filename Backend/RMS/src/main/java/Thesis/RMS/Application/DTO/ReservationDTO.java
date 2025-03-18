package Thesis.RMS.Application.DTO;

import Thesis.RMS.Domain.Enums.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReservationDTO {
    private Long tableId;
    private String customerName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ReservationStatus status;
}
