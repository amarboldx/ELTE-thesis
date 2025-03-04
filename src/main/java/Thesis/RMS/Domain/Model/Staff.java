package Thesis.RMS.Domain.Model;

import Thesis.RMS.Domain.Enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long staffId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Role role;

    @OneToMany(mappedBy = "staff", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Shift> shifts;

    @OneToMany(mappedBy = "assignedStaff", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TableData> assignedTables;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "userId")
    private User user;

}
