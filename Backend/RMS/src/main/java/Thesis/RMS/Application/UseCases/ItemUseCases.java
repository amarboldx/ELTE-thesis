package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.ItemDTO;
import Thesis.RMS.Domain.Enums.Allergen_List;
import Thesis.RMS.Domain.Model.Item;
import Thesis.RMS.Domain.Repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class ItemUseCases {
    private final ItemRepository itemRepository;

    public Item createItem(String name, String description, double price, List<Allergen_List> allergenLists) {
        Item item = new Item();
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setAllergenList(allergenLists);
        item.setAvailable(true);

        return itemRepository.save(item);
    }

    public void deleteItem(Long itemId) {
        itemRepository.deleteById(itemId);
    }

    public Item updateItem(Long itemId, String name, String description, double price, List<Allergen_List> allergenLists, boolean available) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setAllergenList(allergenLists);
        item.setAvailable(available);

        return itemRepository.save(item);
    }

    @Transactional
    public List<ItemDTO> getItems() {
        return itemRepository.findAll().stream()
                .map(ItemDTO::new)
                .collect(Collectors.toList());
    }

    public List<ItemDTO> getAvailableItems() {
        return itemRepository.findByAvailable(true).stream()
                .map(ItemDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ItemDTO> getItemsByAllergen(List<Allergen_List> allergenList) {
        return itemRepository.findByAllergenLists(allergenList).stream()
                .map(ItemDTO::new)
                .collect(Collectors.toList());
    }

    public void updateItemAvailability(Long itemId, boolean available) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        item.setAvailable(available);

        itemRepository.save(item);
    }

    public void updateItemPrice(Long itemId, double price) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        item.setPrice(price);

        itemRepository.save(item);
    }

    @Transactional
    public ItemDTO getItemById(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        return new ItemDTO(item);
    }
    @Transactional
    public ItemDTO getByName(String name) {
        Item item = itemRepository.findByName(name)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Item with name " + name + " not found."));
        return new ItemDTO(item);
    }

    @Transactional
    public List<ItemDTO> getItemsByListofIds(List<Long> itemIds) {
        List<ItemDTO> items = new ArrayList<>();

        for (Long itemId : itemIds) {
            itemRepository.findById(itemId).ifPresent(item -> items.add(new ItemDTO(item)));
        }

        return items;
    }

}
