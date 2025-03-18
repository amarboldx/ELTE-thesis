package Thesis.RMS.Domain.Model;

import Thesis.RMS.Domain.Enums.Allergen_List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private String description;

    @ElementCollection(targetClass = Allergen_List.class, fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "item_allergens", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "allergen")
    private List<Allergen_List> allergenList;

    @Column(nullable = false)
    private boolean available;

    @JsonIgnore
    @ManyToMany(mappedBy = "items")
    private List<Order> orders = new ArrayList<>();
}
